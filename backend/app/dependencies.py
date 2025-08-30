
# This file is no longer needed as we've moved authentication logic to core/security.py
# Keeping for backward compatibility but imports should be updated to use core.security
from .core.security import get_current_user, get_current_active_user, require_teacher, require_student
