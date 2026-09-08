from django.db import migrations, models
import re


def _part(value, fallback='Batch', max_length=40):
    cleaned = re.sub(r'[^A-Za-z0-9]+', '', str(value or '').strip())
    return (cleaned or fallback)[:max_length]


def _time_code(batch_timing):
    match = re.search(r'(\d{1,2})(?::(\d{2}))?\s*(AM|PM)', str(batch_timing or ''), re.IGNORECASE)
    if not match:
        return 'TIME'
    hour, minute, suffix = match.groups()
    minute = minute if minute and minute != '00' else ''
    return f"{int(hour)}{minute}{suffix.upper()}"


def backfill_batch_codes(apps, schema_editor):
    Batches = apps.get_model('connect', 'Batches')
    BatchTrainerAssignment = apps.get_model('connect', 'BatchTrainerAssignment')
    used = set(
        code.lower()
        for code in Batches.objects.exclude(batch_code__isnull=True).exclude(batch_code='').values_list('batch_code', flat=True)
    )

    for batch in Batches.objects.filter(models.Q(batch_code__isnull=True) | models.Q(batch_code='')).select_related('course_name', 'faculty').order_by('id'):
        trainer = (
            BatchTrainerAssignment.objects.filter(batch_id=batch.id, is_primary=True).select_related('trainer').first()
            or BatchTrainerAssignment.objects.filter(batch_id=batch.id).select_related('trainer').order_by('id').first()
        )
        trainer_obj = trainer.trainer if trainer else batch.faculty
        trainer_name = ''
        if trainer_obj:
            trainer_name = f"{getattr(trainer_obj, 'first_name', '') or ''}{getattr(trainer_obj, 'last_name', '') or ''}"
        course_name = getattr(batch.course_name, 'course_name', '') if batch.course_name_id else ''
        month = batch.start_date.strftime('%b').upper() if batch.start_date else 'MONTH'
        base = '-'.join([
            _time_code(batch.batch_timing),
            month,
            _part(course_name, 'Course'),
            _part(trainer_name, 'Trainer'),
        ])
        candidate = base
        suffix = 2
        while candidate.lower() in used:
            candidate = f"{base}-{suffix}"
            suffix += 1
        batch.batch_code = candidate
        batch.save(update_fields=['batch_code'])
        used.add(candidate.lower())


class Migration(migrations.Migration):

    dependencies = [
        ('connect', '0027_quiztest_course_quiztest_creation_method_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='batches',
            name='batch_code',
            field=models.CharField(blank=True, max_length=120, null=True, unique=True),
        ),
        migrations.RunPython(backfill_batch_codes, migrations.RunPython.noop),
    ]
