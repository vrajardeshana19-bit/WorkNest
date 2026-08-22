from __future__ import annotations

import logging
from typing import Protocol

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)

BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"


class EmailSender(Protocol):
    def send_verification_email(self, *, to_email: str, token: str) -> None: ...

    def send_credentials_email(
        self, *, to_email: str, login_id: str, temporary_password: str
    ) -> None: ...

    def send_leave_status_email(
        self, *, to_email: str, employee_name: str, status: str, leave_dates: str, leave_type: str
    ) -> None: ...

    def send_payroll_processed_email(
        self, *, to_email: str, employee_name: str, month_year: str, net_payable: str
    ) -> None: ...

    def send_test_email(self, *, to_email: str) -> None: ...


def _worknest_shell(title: str, body_html: str) -> str:
    settings = get_settings()
    app_name = settings.app_name if hasattr(settings, "app_name") else "WorkNest"
    return f"""
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f5f0ff;font-family:system-ui,sans-serif;color:#1e1b4b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:24px auto;background:#ffffff;border:1px solid #ddd6fe;border-radius:16px;overflow:hidden;">
    <tr>
      <td style="background:linear-gradient(135deg,#7e22ce,#9333ea);padding:20px 24px;color:#fff;">
        <div style="font-size:20px;font-weight:800;">{app_name}</div>
        <div style="font-size:12px;opacity:0.9;margin-top:4px;">HRMS Enterprise</div>
      </td>
    </tr>
    <tr>
      <td style="padding:24px;">
        <h1 style="margin:0 0 12px;font-size:18px;">{title}</h1>
        {body_html}
        <p style="margin-top:24px;font-size:11px;color:#64748b;">
          This is an automated message from WorkNest. Please do not reply to this email.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
"""


class ConsoleEmailSender:
    def send_verification_email(self, *, to_email: str, token: str) -> None:
        settings = get_settings()
        verify_url = f"{settings.frontend_url}/verify-email?token={token}"
        print(
            "\n[WorkNest Email:console]\n"
            f"  To: {to_email}\n"
            f"  Token: {token}\n"
            f"  Link: {verify_url}\n"
        )

    def send_credentials_email(
        self, *, to_email: str, login_id: str, temporary_password: str
    ) -> None:
        print(
            "\n[WorkNest Email:console]\n"
            f"  To: {to_email}\n"
            f"  Login ID: {login_id}\n"
            f"  Temporary Password: {temporary_password}\n"
            "  Action: User must change password on first login.\n"
        )

    def send_leave_status_email(
        self, *, to_email: str, employee_name: str, status: str, leave_dates: str, leave_type: str
    ) -> None:
        print(
            "\n[WorkNest Email:console]\n"
            f"  To: {to_email}\n"
            f"  Subject: Leave request {status}\n"
            f"  Hi {employee_name},\n"
            f"  Your {leave_type} request ({leave_dates}) has been {status.lower()}.\n"
        )

    def send_payroll_processed_email(
        self, *, to_email: str, employee_name: str, month_year: str, net_payable: str
    ) -> None:
        print(
            "\n[WorkNest Email:console]\n"
            f"  To: {to_email}\n"
            f"  Subject: Payslip ready — {month_year}\n"
            f"  Hi {employee_name},\n"
            f"  Your payroll for {month_year} has been processed. Net payable: ₹{net_payable}.\n"
            "  Log in to WorkNest to download your payslip.\n"
        )

    def send_test_email(self, *, to_email: str) -> None:
        print(f"\n[WorkNest Email:console] Test email would be sent to {to_email}\n")


class BrevoEmailSender:
    def __init__(self) -> None:
        settings = get_settings()
        self.api_key = settings.brevo_api_key
        self.sender_name = settings.brevo_sender_name
        self.sender_email = settings.brevo_sender_email
        self.frontend_url = settings.frontend_url

        if not self.api_key:
            raise ValueError("BREVO_API_KEY is required when EMAIL_PROVIDER=brevo")
        if not self.sender_email:
            raise ValueError("BREVO_SENDER_EMAIL is required when EMAIL_PROVIDER=brevo")

    def _send(self, *, to_email: str, to_name: str, subject: str, html_content: str) -> None:
        payload = {
            "sender": {"name": self.sender_name, "email": self.sender_email},
            "to": [{"email": to_email, "name": to_name or to_email}],
            "subject": subject,
            "htmlContent": html_content,
        }
        headers = {
            "api-key": self.api_key,
            "Content-Type": "application/json",
            "accept": "application/json",
        }

        try:
            with httpx.Client(timeout=30.0) as client:
                response = client.post(BREVO_API_URL, headers=headers, json=payload)
                response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            detail = exc.response.text
            logger.error("Brevo API error %s: %s", exc.response.status_code, detail)
            raise RuntimeError(f"Brevo email failed ({exc.response.status_code}): {detail}") from exc
        except httpx.HTTPError as exc:
            logger.error("Brevo request failed: %s", exc)
            raise RuntimeError(f"Brevo email request failed: {exc}") from exc

        logger.info("Brevo email sent to %s — %s", to_email, subject)

    def send_verification_email(self, *, to_email: str, token: str) -> None:
        verify_url = f"{self.frontend_url}/verify-email?token={token}"
        body = f"""
        <p style="font-size:14px;line-height:1.6;">Verify your email address to activate your WorkNest account.</p>
        <p style="margin:20px 0;">
          <a href="{verify_url}" style="display:inline-block;background:#7e22ce;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:700;">
            Verify Email
          </a>
        </p>
        <p style="font-size:12px;color:#64748b;">Or copy this link:<br><span style="word-break:break-all;">{verify_url}</span></p>
        """
        self._send(
            to_email=to_email,
            to_name=to_email.split("@")[0],
            subject="Verify your WorkNest email",
            html_content=_worknest_shell("Verify your email", body),
        )

    def send_credentials_email(
        self, *, to_email: str, login_id: str, temporary_password: str
    ) -> None:
        body = f"""
        <p style="font-size:14px;line-height:1.6;">Your WorkNest account has been created. Use the credentials below to sign in. You will be asked to change your password on first login.</p>
        <table style="width:100%;margin:16px 0;font-size:14px;border-collapse:collapse;">
          <tr><td style="padding:8px 0;color:#64748b;">Login ID</td><td style="padding:8px 0;font-weight:700;font-family:monospace;">{login_id}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Temporary Password</td><td style="padding:8px 0;font-weight:700;font-family:monospace;">{temporary_password}</td></tr>
        </table>
        <p style="margin:20px 0;">
          <a href="{self.frontend_url}" style="display:inline-block;background:#7e22ce;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:700;">
            Sign in to WorkNest
          </a>
        </p>
        """
        self._send(
            to_email=to_email,
            to_name=login_id,
            subject="Your WorkNest account credentials",
            html_content=_worknest_shell("Welcome to WorkNest", body),
        )

    def send_leave_status_email(
        self, *, to_email: str, employee_name: str, status: str, leave_dates: str, leave_type: str
    ) -> None:
        color = "#059669" if status == "APPROVED" else "#dc2626" if status == "REJECTED" else "#d97706"
        body = f"""
        <p style="font-size:14px;line-height:1.6;">Hi <strong>{employee_name}</strong>,</p>
        <p style="font-size:14px;line-height:1.6;">Your leave request has been updated.</p>
        <table style="width:100%;margin:16px 0;font-size:14px;border-collapse:collapse;">
          <tr><td style="padding:8px 0;color:#64748b;">Type</td><td style="padding:8px 0;">{leave_type}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Dates</td><td style="padding:8px 0;">{leave_dates}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Status</td><td style="padding:8px 0;font-weight:800;color:{color};">{status}</td></tr>
        </table>
        """
        self._send(
            to_email=to_email,
            to_name=employee_name,
            subject=f"Leave request {status.title()} — WorkNest",
            html_content=_worknest_shell("Leave request update", body),
        )

    def send_payroll_processed_email(
        self, *, to_email: str, employee_name: str, month_year: str, net_payable: str
    ) -> None:
        body = f"""
        <p style="font-size:14px;line-height:1.6;">Hi <strong>{employee_name}</strong>,</p>
        <p style="font-size:14px;line-height:1.6;">Payroll for <strong>{month_year}</strong> has been processed.</p>
        <p style="font-size:28px;font-weight:800;color:#7e22ce;margin:16px 0;">₹{net_payable}</p>
        <p style="font-size:13px;color:#64748b;">Net payable amount</p>
        <p style="margin:20px 0;">
          <a href="{self.frontend_url}" style="display:inline-block;background:#7e22ce;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:700;">
            View payslip in WorkNest
          </a>
        </p>
        """
        self._send(
            to_email=to_email,
            to_name=employee_name,
            subject=f"Payslip ready — {month_year}",
            html_content=_worknest_shell("Payroll processed", body),
        )

    def send_test_email(self, *, to_email: str) -> None:
        body = """
        <p style="font-size:14px;line-height:1.6;">This is a test email from your WorkNest HRMS backend.</p>
        <p style="font-size:14px;line-height:1.6;">If you received this, Brevo integration is working correctly.</p>
        """
        self._send(
            to_email=to_email,
            to_name="WorkNest Admin",
            subject="WorkNest — Brevo test email",
            html_content=_worknest_shell("Brevo connected successfully", body),
        )


def get_email_sender() -> EmailSender:
    settings = get_settings()
    if settings.email_provider == "brevo":
        return BrevoEmailSender()
    if settings.email_provider == "console":
        return ConsoleEmailSender()
    raise NotImplementedError(
        f"Email provider '{settings.email_provider}' is not configured. Use 'console' or 'brevo'."
    )
