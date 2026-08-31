from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('connect', '0023_student_course_enrollments'),
    ]

    operations = [
        migrations.CreateModel(
            name='ReassignedStudentRecord',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('student_name', models.CharField(max_length=220)),
                ('student_code', models.CharField(max_length=50)),
                ('course_name', models.CharField(blank=True, max_length=255)),
                ('source_batch_number', models.CharField(blank=True, max_length=80)),
                ('target_batch_number', models.CharField(blank=True, max_length=80)),
                ('previous_trainer_name', models.CharField(blank=True, max_length=220)),
                ('reassigned_trainer_name', models.CharField(blank=True, max_length=220)),
                ('reassignment_reason', models.TextField(blank=True, null=True)),
                ('reassigned_at', models.DateTimeField()),
                ('total_sessions', models.IntegerField(default=0)),
                ('completed_sessions', models.IntegerField(default=0)),
                ('completion_percentage', models.FloatField(default=0)),
                ('completed_session_details', models.JSONField(blank=True, default=list)),
                ('attendance_total', models.IntegerField(default=0)),
                ('present_days', models.IntegerField(default=0)),
                ('absent_days', models.IntegerField(default=0)),
                ('attendance_percentage', models.FloatField(default=0)),
                ('attendance_summary', models.JSONField(blank=True, default=list)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('completion_request', models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='reassignment_record', to='connect.sessioncompletionrequest')),
                ('previous_trainer', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='reassigned_from_records', to='connect.employee')),
                ('reassigned_trainer', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='reassigned_to_records', to='connect.employee')),
                ('source_batch', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='reassigned_from_records', to='connect.batches')),
                ('student', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='reassignment_records', to='connect.students')),
                ('target_batch', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='reassigned_to_records', to='connect.batches')),
            ],
            options={
                'db_table': 'reassigned_student_records',
                'ordering': ['-reassigned_at'],
            },
        ),
        migrations.AddIndex(
            model_name='reassignedstudentrecord',
            index=models.Index(fields=['previous_trainer', 'reassigned_at'], name='reassigned__previou_ec1c31_idx'),
        ),
        migrations.AddIndex(
            model_name='reassignedstudentrecord',
            index=models.Index(fields=['student', 'source_batch'], name='reassigned__student_4e88d7_idx'),
        ),
    ]
