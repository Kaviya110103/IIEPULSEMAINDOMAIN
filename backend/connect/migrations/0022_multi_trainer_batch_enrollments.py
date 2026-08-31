from django.db import migrations, models
import django.db.models.deletion


def backfill_batch_trainers_and_enrollments(apps, schema_editor):
    Batches = apps.get_model('connect', 'Batches')
    Students = apps.get_model('connect', 'Students')
    BatchTrainerAssignment = apps.get_model('connect', 'BatchTrainerAssignment')
    StudentBatchEnrollment = apps.get_model('connect', 'StudentBatchEnrollment')

    for batch in Batches.objects.exclude(faculty_id__isnull=True).iterator():
        BatchTrainerAssignment.objects.get_or_create(
            batch_id=batch.id,
            trainer_id=batch.faculty_id,
            defaults={'is_primary': True},
        )

    for student in Students.objects.exclude(assigned_batch_id__isnull=True).iterator():
        StudentBatchEnrollment.objects.get_or_create(
            student_id=student.id,
            batch_id=student.assigned_batch_id,
            defaults={'is_active': True},
        )


class Migration(migrations.Migration):

    dependencies = [
        ('connect', '0021_rename_connect_stu_student_b74338_idx_student_log_student_145bf3_idx_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='BatchTrainerAssignment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('is_primary', models.BooleanField(default=False)),
                ('assigned_at', models.DateTimeField(auto_now_add=True)),
                ('batch', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='trainer_assignments', to='connect.batches')),
                ('trainer', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='batch_trainer_assignments', to='connect.employee')),
            ],
            options={
                'db_table': 'batch_trainer_assignments',
                'unique_together': {('batch', 'trainer')},
            },
        ),
        migrations.CreateModel(
            name='StudentBatchEnrollment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('is_active', models.BooleanField(default=True)),
                ('assigned_at', models.DateTimeField(auto_now_add=True)),
                ('assigned_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='student_batch_assignments', to='auth.user')),
                ('batch', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='student_enrollments', to='connect.batches')),
                ('student', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='batch_enrollments', to='connect.students')),
            ],
            options={
                'db_table': 'student_batch_enrollments',
                'unique_together': {('student', 'batch')},
            },
        ),
        migrations.AddField(
            model_name='coursesession',
            name='completed_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='completed_course_sessions', to='connect.employee'),
        ),
        migrations.AddIndex(
            model_name='batchtrainerassignment',
            index=models.Index(fields=['batch', 'trainer'], name='batch_train_batch_i_5f8495_idx'),
        ),
        migrations.AddIndex(
            model_name='batchtrainerassignment',
            index=models.Index(fields=['trainer'], name='batch_train_trainer_81268b_idx'),
        ),
        migrations.AddIndex(
            model_name='studentbatchenrollment',
            index=models.Index(fields=['student', 'batch'], name='student_bat_student_8dfe55_idx'),
        ),
        migrations.AddIndex(
            model_name='studentbatchenrollment',
            index=models.Index(fields=['batch', 'is_active'], name='student_bat_batch_i_bd6164_idx'),
        ),
        migrations.RunPython(backfill_batch_trainers_and_enrollments, migrations.RunPython.noop),
    ]
