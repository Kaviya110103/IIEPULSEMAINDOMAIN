from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('connect', '0024_reassigned_student_record'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='studentattendance',
            unique_together=set(),
        ),
        migrations.AddField(
            model_name='studentattendance',
            name='session',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='attendance_records', to='connect.coursesession'),
        ),
        migrations.AlterUniqueTogether(
            name='studentattendance',
            unique_together={('student', 'batch', 'staff', 'date', 'session')},
        ),
    ]
