from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('connect', '0015_leave_alert_notifications'),
    ]

    operations = [
        migrations.AlterField(
            model_name='sessionnotification',
            name='notification_type',
            field=models.CharField(
                choices=[
                    ('session_completed', 'Session Completed'),
                    ('doubt_raised', 'Doubt Raised'),
                    ('doubt_resolved', 'Doubt Resolved'),
                    ('leave_alert', 'Leave Alert'),
                    ('assignment', 'Assignment'),
                    ('quiz_result', 'Quiz Result'),
                    ('leave_application', 'Leave Application'),
                    ('announcement', 'Announcement'),
                    ('support', 'Support'),
                ],
                max_length=50,
            ),
        ),
    ]
