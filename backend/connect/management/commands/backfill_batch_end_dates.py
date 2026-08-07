from django.core.management.base import BaseCommand

from connect.api_views import calculate_batch_end_date
from connect.models import Batches


class Command(BaseCommand):
    help = 'Backfill missing batch end dates from batch start date and course duration.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Report changes without saving them.',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        updated = 0
        skipped_existing = 0
        skipped_invalid = 0

        batches = Batches.objects.select_related('course_name').order_by('id')
        for batch in batches:
            if batch.end_date:
                skipped_existing += 1
                continue

            try:
                end_date = calculate_batch_end_date(batch.course_name, batch.start_date)
            except Exception as exc:
                skipped_invalid += 1
                self.stdout.write(
                    self.style.WARNING(
                        f'Skipped batch {batch.id} ({batch.batch_number}): {exc}'
                    )
                )
                continue

            if not dry_run:
                batch.end_date = end_date
                batch.save(update_fields=['end_date'])
            updated += 1
            self.stdout.write(
                f'{"Would update" if dry_run else "Updated"} batch {batch.id} '
                f'({batch.batch_number}) end_date={end_date}'
            )

        self.stdout.write(
            self.style.SUCCESS(
                f'Backfill complete. updated={updated}, '
                f'skipped_existing={skipped_existing}, skipped_invalid={skipped_invalid}'
            )
        )
