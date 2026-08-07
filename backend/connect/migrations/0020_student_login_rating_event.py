from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('connect', '0019_alter_sessionnotification_notification_type'),
    ]

    operations = [
        migrations.CreateModel(
            name='StudentLoginRatingEvent',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('event_type', models.CharField(choices=[('login', 'Login'), ('app_use', 'App Use')], max_length=20)),
                ('occurred_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('student', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='login_rating_events', to='connect.students')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='student_login_rating_events', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'student_login_rating_events',
                'ordering': ['-occurred_at'],
            },
        ),
        migrations.AddIndex(
            model_name='studentloginratingevent',
            index=models.Index(fields=['student', 'occurred_at'], name='connect_stu_student_b74338_idx'),
        ),
        migrations.AddIndex(
            model_name='studentloginratingevent',
            index=models.Index(fields=['student', 'event_type', 'occurred_at'], name='connect_stu_student_476495_idx'),
        ),
    ]
