"""Documentation generation utilities."""

import sys


def _log(condition, msg):
    """Conditionally report progress."""
    if condition:
        print(msg, file=sys.stderr)
    return condition


def _str(val):
    """Hacky string conversion."""
    if isinstance(val, str):
        return val
    if isinstance(val, bool):
        return str(val).lower()
    if isinstance(val, int):
        return str(val)
    return str(val)
