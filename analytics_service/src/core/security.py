from typing import Optional

from jose import JWTError, jwt

from src.core.config import settings


class SecurityService:
    @staticmethod
    def decode_token(token: str) -> Optional[str]:
        try:
            payload = jwt.decode(
                token,
                settings.jwt_settings.secret_key,
                algorithms=[settings.jwt_settings.algorithm],
            )
            user_id: str = payload.get("sub")
            return user_id
        except JWTError:
            return None


security_service = SecurityService()
