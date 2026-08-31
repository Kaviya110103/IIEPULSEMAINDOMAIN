from django.db import migrations, models
import django.db.models.deletion


def backfill_student_course_enrollments(apps, schema_editor):
    Courses = apps.get_model('connect', 'Courses')
    Students = apps.get_model('connect', 'Students')
    StudentCourseEnrollment = apps.get_model('connect', 'StudentCourseEnrollment')
    StudentBatchEnrollment = apps.get_model('connect', 'StudentBatchEnrollment')

    course_by_name = {
        str(course.course_name or '').strip().lower(): course
        for course in Courses.objects.all()
    }

    for student in Students.objects.all().iterator():
        course_names = [part.strip() for part in str(student.course or '').split(',') if part.strip()]
        enrollments = []
        for course_name in course_names:
            course = course_by_name.get(course_name.lower())
            if not course:
                continue
            enrollment, _ = StudentCourseEnrollment.objects.get_or_create(
                student_id=student.id,
                course_id=course.id,
                defaults={'is_active': True},
            )
            if not enrollment.is_active:
                enrollment.is_active = True
                enrollment.save(update_fields=['is_active'])
            enrollments.append(enrollment)

        for batch_enrollment in StudentBatchEnrollment.objects.filter(student_id=student.id).select_related('batch', 'batch__course_name'):
            if batch_enrollment.course_enrollment_id:
                continue
            batch_course = batch_enrollment.batch.course_name if batch_enrollment.batch_id else None
            if not batch_course:
                continue
            enrollment, _ = StudentCourseEnrollment.objects.get_or_create(
                student_id=student.id,
                course_id=batch_course.id,
                defaults={'is_active': True},
            )
            batch_enrollment.course_enrollment = enrollment
            batch_enrollment.save(update_fields=['course_enrollment'])


class Migration(migrations.Migration):

    dependencies = [
        ('connect', '0022_multi_trainer_batch_enrollments'),
    ]

    operations = [
        migrations.CreateModel(
            name='StudentCourseEnrollment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('is_active', models.BooleanField(default=True)),
                ('enrolled_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('course', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='student_enrollments', to='connect.courses')),
                ('enrolled_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='student_course_enrollments', to='auth.user')),
                ('student', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='course_enrollments', to='connect.students')),
            ],
            options={
                'db_table': 'student_course_enrollments',
                'unique_together': {('student', 'course')},
            },
        ),
        migrations.AddField(
            model_name='studentbatchenrollment',
            name='course_enrollment',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='batch_assignments', to='connect.studentcourseenrollment'),
        ),
        migrations.AddIndex(
            model_name='studentcourseenrollment',
            index=models.Index(fields=['student', 'course'], name='student_cou_student_42d33a_idx'),
        ),
        migrations.AddIndex(
            model_name='studentcourseenrollment',
            index=models.Index(fields=['course', 'is_active'], name='student_cou_course__845270_idx'),
        ),
        migrations.RunPython(backfill_student_course_enrollments, migrations.RunPython.noop),
    ]
