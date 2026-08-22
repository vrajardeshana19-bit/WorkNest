"""Shared enums — single source of truth for DB, JWT, and Pydantic."""

from enum import Enum


class Role(str, Enum):
    EMPLOYEE = "EMPLOYEE"
    HR = "HR"
    ADMIN = "ADMIN"


class AttendanceStatus(str, Enum):
    CHECKED_IN = "CHECKED_IN"
    CHECKED_OUT = "CHECKED_OUT"
    COMPLETE = "COMPLETE"
    ABSENT = "ABSENT"


class EmployeeDisplayStatus(str, Enum):
    """Dashboard card indicator — mockup: green / airplane / yellow."""

    PRESENT = "PRESENT"
    ON_LEAVE = "ON_LEAVE"
    ABSENT = "ABSENT"
