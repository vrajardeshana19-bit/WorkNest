from typing import Protocol

from app.config import get_settings


class EmailSender(Protocol):
    def send_verification_email(self, *, to_email: str, token: str) -> None: ...

    def send_credentials_email(
        self, *, to_email: str, login_id: str, temporary_password: str
    ) -> None: ...


class ConsoleEmailSender:
    def send_verification_email(self, *, to_email: str, token: str) -> None:
        settings = get_settings()
        verify_url = f"{settings.frontend_url}/verify-email?token={token}"
        print(
            "\n[Dayflow Email:console]\n"
            f"  To: {to_email}\n"
            f"  Token: {token}\n"
            f"  Link: {verify_url}\n"
        )

    def send_credentials_email(
        self, *, to_email: str, login_id: str, temporary_password: str
    ) -> None:
        print(
            "\n[Dayflow Email:console]\n"
            f"  To: {to_email}\n"
            f"  Login ID: {login_id}\n"
            f"  Temporary Password: {temporary_password}\n"
            "  Action: User must change password on first login.\n"
        )


def get_email_sender() -> EmailSender:
    settings = get_settings()
    if settings.email_provider == "console":
        return ConsoleEmailSender()
    raise NotImplementedError(
        f"Email provider '{settings.email_provider}' is not configured yet."
    )
