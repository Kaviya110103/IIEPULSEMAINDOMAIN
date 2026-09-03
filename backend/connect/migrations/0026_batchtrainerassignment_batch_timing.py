from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('connect', '0025_trainer_session_attendance'),
    ]

    operations = [
        migrations.AddField(
            model_name='batchtrainerassignment',
            name='batch_timing',
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
    ]
