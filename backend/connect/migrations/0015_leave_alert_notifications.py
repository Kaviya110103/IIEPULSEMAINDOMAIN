from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('connect', '0014_fix_employee_branch_choice'),
    ]

    operations = [
        migrations.AlterField(
            model_name='sessionnotification',
            name='notification_type',
            field=models.CharField(choices=[('session_completed', 'Session Completed'), ('doubt_raised', 'Doubt Raised'), ('doubt_resolved', 'Doubt Resolved'), ('leave_alert', 'Leave Alert')], max_length=50),
        ),
        migrations.AlterField(
            model_name='sessionnotification',
            name='session',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='connect.coursesession'),
        ),
    ]
