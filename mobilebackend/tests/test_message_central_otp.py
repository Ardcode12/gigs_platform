import unittest
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch

from app.models.otp_verification import OtpVerification
from app.services import otp


class TwilioVerifyOtpTests(unittest.TestCase):
    def setUp(self):
        self.phone = "+919876543210"

    @patch("app.services.otp.Client")
    def test_create_signup_otp_uses_twilio_verify(self, mock_client):
        verification = MagicMock()
        verification.sid = "VE123"
        mock_client.return_value.verify.v2.services.return_value.verifications.create.return_value = verification

        mock_db = MagicMock()
        mock_db.scalars.return_value.all.return_value = []
        mock_db.scalars.return_value.first.return_value = None

        result = otp.create_signup_otp(mock_db, self.phone)

        self.assertEqual(result, "VE123")
        saved = mock_db.add.call_args.args[0]
        self.assertEqual(saved.verification_id, "VE123")
        self.assertIsNone(saved.code_hash)

        create_call = (
            mock_client.return_value.verify.v2.services.return_value.verifications.create.call_args
        )
        self.assertEqual(create_call.kwargs["to"], self.phone)
        self.assertEqual(create_call.kwargs["channel"], "sms")

    @patch("app.services.otp.Client")
    def test_verify_signup_otp_approves_twilio_verification(self, mock_client):
        check = MagicMock()
        check.status = "approved"
        mock_client.return_value.verify.v2.services.return_value.verification_checks.create.return_value = check

        otp_row = OtpVerification(
            phone=self.phone,
            verification_id="VE123",
            purpose="signup",
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=10),
            used_at=None,
            attempts=0,
        )
        mock_db = MagicMock()
        mock_db.scalars.return_value.first.return_value = otp_row

        ok, reason = otp.verify_signup_otp(mock_db, self.phone, "123456")

        self.assertTrue(ok)
        self.assertEqual(reason, "OK")
        verification_call = (
            mock_client.return_value.verify.v2.services.return_value.verification_checks.create.call_args
        )
        self.assertEqual(verification_call.kwargs["to"], self.phone)
        self.assertEqual(verification_call.kwargs["code"], "123456")

    def test_phone_is_normalized_to_e164_for_indian_numbers(self):
        self.assertEqual(otp.normalize_phone("7708673148"), "+917708673148")
        self.assertEqual(otp.normalize_phone("+917708673148"), "+917708673148")
        self.assertEqual(otp.normalize_phone("917708673148"), "+917708673148")


if __name__ == "__main__":
    unittest.main()