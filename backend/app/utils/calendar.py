import calendar
from datetime import date


def count_weekdays_in_month(year: int, month: int) -> int:
    _, days_in_month = calendar.monthrange(year, month)
    return sum(
        1
        for day in range(1, days_in_month + 1)
        if date(year, month, day).weekday() < 5
    )


def count_weekdays_in_month_excluding_dates(
    year: int,
    month: int,
    excluded_dates: set[date],
) -> int:
    _, days_in_month = calendar.monthrange(year, month)
    count = 0
    for day in range(1, days_in_month + 1):
        current = date(year, month, day)
        if current.weekday() < 5 and current not in excluded_dates:
            count += 1
    return count
