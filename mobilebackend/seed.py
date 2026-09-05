"""Seed the database with a society, workers, customers and a realistic job history.

Run after `alembic upgrade head`:

    python seed.py            # refuses if data already exists
    python seed.py --reset    # wipes every table first, then seeds

The point is that every one of the twelve worker features has something to show on
first launch: open requests, a job in progress, completed jobs with payments in
today's / this week's / this month's buckets, ratings with written feedback, a chat
thread with both sides, an approved extra amount, a pending one, and unread
notifications.
"""

from __future__ import annotations

import argparse
import sys
from datetime import datetime, timedelta

from sqlalchemy import delete, func, select

from app.core.config import settings
from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models import (
    CallRequest,
    ChatMessage,
    Customer,
    ExtraAmountRequest,
    ExtraAmountStatus,
    Job,
    JobReport,
    JobRejection,
    JobService,
    JobStatus,
    JobStatusEvent,
    MessageSender,
    Notification,
    NotificationType,
    PasswordReset,
    Payment,
    PaymentStatus,
    PaymentMethod,
    Rating,
    Society,
    Worker,
)

TZ = settings.tz
NOW = datetime.now(TZ)

# Every worker's shared password in the seed. The society hands this out and
# `must_change_password` forces it to be replaced at first login.
INITIAL_PASSWORD = "worker123"

#: Noida Sector 62 area — jobs are placed a few km away so distance/ETA are non-zero.
WORKER_HOME = (28.6270, 77.3720)

# Tables in reverse dependency order, for --reset.
_WIPE_ORDER = (
    JobReport,
    PasswordReset,
    Notification,
    Payment,
    Rating,
    CallRequest,
    ChatMessage,
    ExtraAmountRequest,
    JobRejection,
    JobStatusEvent,
    JobService,
    Job,
    JobReport,
    Worker,
    Customer,
    Society,
)


def _events(job: Job, statuses: list[tuple[JobStatus, datetime]]) -> list[JobStatusEvent]:
    return [JobStatusEvent(job_id=job.id, status=s, at=at) for s, at in statuses]


def wipe(db) -> None:
    for model in _WIPE_ORDER:
        db.execute(delete(model))
    db.commit()
    print("· cleared existing data")


def seed(db) -> None:
    # -- society -----------------------------------------------------------
    society = Society(name="Sunrise Workers Cooperative", city="Noida")
    db.add(society)
    db.flush()

    # -- workers -----------------------------------------------------------
    password_hash = hash_password(INITIAL_PASSWORD)
    workers = [
        Worker(
            society_id=society.id,
            worker_code="WM1042",
            phone="+919876543210",
            password_hash=password_hash,
            must_change_password=True,
            name="Ramesh Kumar",
            city="Noida",
            skills=["Plumbing", "Water Tank Cleaning", "Pipe Fitting"],
            aadhaar_masked="XXXX XXXX 4821",
            is_available=True,
            last_lat=WORKER_HOME[0],
            last_lng=WORKER_HOME[1],
            location_updated_at=NOW - timedelta(minutes=4),
            completed_jobs=0,
            member_since=NOW - timedelta(days=420),
        ),
        Worker(
            society_id=society.id,
            worker_code="WM1043",
            phone="+919876500011",
            password_hash=password_hash,
            must_change_password=True,
            name="Suresh Yadav",
            city="Noida",
            skills=["Electrical", "Fan Installation", "Wiring"],
            aadhaar_masked="XXXX XXXX 9037",
            is_available=True,
            last_lat=28.6180,
            last_lng=77.3810,
            location_updated_at=NOW - timedelta(minutes=20),
            member_since=NOW - timedelta(days=210),
        ),
        Worker(
            society_id=society.id,
            worker_code="WM1044",
            phone="+919812345678",
            password_hash=password_hash,
            # Already chose their own password, so no forced change — useful for
            # testing the login path that goes straight to the home screen.
            must_change_password=False,
            name="Anil Sharma",
            city="Noida",
            skills=["Carpentry", "Furniture Repair"],
            aadhaar_masked="XXXX XXXX 1177",
            is_available=False,
            member_since=NOW - timedelta(days=95),
        ),
    ]
    db.add_all(workers)
    db.flush()
    ramesh, suresh, _anil = workers

    # -- customers ---------------------------------------------------------
    customer_password_hash = hash_password("customer123")
    customers = [
        Customer(
            name="Priya Sharma",
            phone="+919811111111",
            email="priya@example.com",
            password_hash=customer_password_hash,
            city="Noida",
            rating_avg=4.8,
            rating_count=23,
            saved_addresses=[
                {
                    "id": "addr_1",
                    "title": "Home",
                    "address": "Flat 402, Lotus Boulevard, Sector 100, Noida",
                    "landmark": "Near Clubhouse",
                    "lat": 28.5355,
                    "lng": 77.3910,
                }
            ],
        ),
        Customer(
            name="Amit Verma",
            phone="+919822222222",
            email="amit@example.com",
            password_hash=customer_password_hash,
            city="Noida",
            rating_avg=4.5,
            rating_count=11,
            saved_addresses=[
                {
                    "id": "addr_2",
                    "title": "Home",
                    "address": "House 12, Sector 62, Noida",
                    "landmark": "Opposite Tech Park",
                    "lat": 28.6270,
                    "lng": 77.3720,
                }
            ],
        ),
        Customer(
            name="Neha Gupta",
            phone="+919833333333",
            email="neha@example.com",
            password_hash=customer_password_hash,
            city="Noida",
            rating_avg=4.9,
            rating_count=34,
            saved_addresses=[],
        ),
        Customer(
            name="Rahul Mehta",
            phone="+919844444444",
            email="rahul@example.com",
            password_hash=customer_password_hash,
            city="Noida",
            rating_avg=4.2,
            rating_count=7,
            saved_addresses=[],
        ),
    ]
    db.add_all(customers)
    db.flush()
    priya, amit, neha, rahul = customers

    # -- 1. open requests, broadcast to whoever is available (spec #3) ------
    request_one = Job(
        customer_id=priya.id,
        worker_id=None,
        service_type="Plumbing",
        service_icon="water-pump",
        work_details=(
            "Kitchen sink is leaking from the base of the tap and the water is "
            "collecting under the cabinet. Please bring a replacement washer."
        ),
        address="Flat 402, Sunrise Residency, Sector 62",
        landmark="Opposite the community hall",
        lat=28.6350,
        lng=77.3650,
        base_amount=450,
        status=JobStatus.REQUESTED,
        requested_at=NOW - timedelta(minutes=6),
    )
    request_two = Job(
        customer_id=neha.id,
        worker_id=None,
        service_type="Water Tank Cleaning",
        service_icon="water",
        work_details="500L overhead tank, not cleaned in about eight months.",
        address="B-14, Green Valley Apartments, Sector 50",
        landmark="Near the Sector 50 metro gate",
        lat=28.5720,
        lng=77.3620,
        base_amount=800,
        status=JobStatus.REQUESTED,
        requested_at=NOW - timedelta(minutes=25),
    )
    # Directed at one worker by the society: rejecting this closes the job, while
    # rejecting a broadcast one only hides it from that worker.
    request_directed = Job(
        customer_id=rahul.id,
        worker_id=ramesh.id,
        service_type="Plumbing",
        service_icon="water-pump",
        work_details="Kitchen tap is leaking and needs a washer replacement.",
        address="C-9, Lotus Enclave, Sector 45",
        landmark="Beside the water tank",
        lat=28.5600,
        lng=77.3400,
        base_amount=600,
        status=JobStatus.REQUESTED,
        requested_at=NOW - timedelta(minutes=12),
    )
    db.add_all([request_one, request_two, request_directed])
    db.flush()

    db.add_all(
        [
            JobService(job_id=request_one.id, name="Tap washer replacement", price=250),
            JobService(job_id=request_one.id, name="Leak inspection", price=200),
            JobService(job_id=request_two.id, name="Overhead tank cleaning (500L)", price=800),
            JobService(job_id=request_directed.id, name="Ceiling fan installation x2", price=600),
        ]
    )
    for job in (request_one, request_two, request_directed):
        db.add(
            JobStatusEvent(
                job_id=job.id,
                status=JobStatus.REQUESTED,
                at=job.requested_at,
                note="Customer raised request",
            )
        )

    # -- 2. the job in progress (spec #8) ----------------------------------
    accepted_at = NOW - timedelta(hours=1, minutes=10)
    active = Job(
        customer_id=amit.id,
        worker_id=ramesh.id,
        service_type="Plumbing",
        service_icon="pipe-leak",
        work_details=(
            "Bathroom pipe joint is dripping behind the wash basin. Water supply "
            "to the bathroom is currently shut off."
        ),
        address="A-7, Rose Garden Society, Sector 61",
        landmark="Second gate, tower A",
        lat=28.6180,
        lng=77.3610,
        base_amount=550,
        status=JobStatus.WORK_STARTED,
        requested_at=accepted_at - timedelta(minutes=8),
        accepted_at=accepted_at,
    )
    db.add(active)
    db.flush()
    db.add_all(
        [
            JobService(job_id=active.id, name="Pipe joint resealing", price=350),
            JobService(job_id=active.id, name="Basin trap check", price=200),
        ]
    )
    db.add_all(
        _events(
            active,
            [
                (JobStatus.REQUESTED, active.requested_at),
                (JobStatus.ACCEPTED, accepted_at),
                (JobStatus.ON_THE_WAY, accepted_at + timedelta(minutes=6)),
                (JobStatus.ARRIVED, accepted_at + timedelta(minutes=28)),
                (JobStatus.WORK_STARTED, accepted_at + timedelta(minutes=34)),
            ],
        )
    )

    # Chat with both sides, and one unread customer message so the badge shows.
    db.add_all(
        [
            ChatMessage(
                job_id=active.id,
                sender=MessageSender.CUSTOMER,
                text="Hi, how long will you take to reach?",
                sent_at=accepted_at + timedelta(minutes=2),
                read_at=accepted_at + timedelta(minutes=3),
            ),
            ChatMessage(
                job_id=active.id,
                sender=MessageSender.WORKER,
                text="On my way, about 20 minutes.",
                sent_at=accepted_at + timedelta(minutes=4),
                read_at=accepted_at + timedelta(minutes=5),
            ),
            ChatMessage(
                job_id=active.id,
                sender=MessageSender.CUSTOMER,
                text="The main valve is near the meter room if you need it.",
                sent_at=NOW - timedelta(minutes=9),
            ),
        ]
    )

    # A pending extra amount: deliberately left undecided so the app shows the
    # "waiting for the customer" state, and so it stays out of the job total.
    db.add(
        ExtraAmountRequest(
            job_id=active.id,
            amount=200,
            reason="The corroded elbow joint has to be replaced, not just resealed.",
            status=ExtraAmountStatus.PENDING,
            created_at=NOW - timedelta(minutes=15),
        )
    )
    db.add(
        CallRequest(
            job_id=active.id,
            requested_by=MessageSender.WORKER,
            note="Need to confirm which bathroom.",
            created_at=NOW - timedelta(minutes=40),
        )
    )

    # -- 3. completed history, with payments and ratings (spec #10, #11) ----
    history = [
        # (customer, service, icon, address, lat, lng, base, extra, days ago, paid, stars, feedback)
        (
            priya,
            "Plumbing",
            "water-pump",
            "Flat 402, Sunrise Residency, Sector 62",
            28.6350,
            77.3650,
            400,
            0,
            0,
            True,
            5,
            "Fixed the leak quickly and cleaned up afterwards. Very polite.",
        ),
        (
            amit,
            "Water Tank Cleaning",
            "water",
            "A-7, Rose Garden Society, Sector 61",
            28.6180,
            77.3610,
            750,
            150,
            0,
            False,
            4,
            "Good work, arrived a little late.",
        ),
        (
            neha,
            "Pipe Fitting",
            "pipe",
            "B-14, Green Valley Apartments, Sector 50",
            28.5720,
            77.3620,
            900,
            0,
            2,
            True,
            5,
            "Excellent. Explained everything before starting.",
        ),
        (
            rahul,
            "Plumbing",
            "water-pump",
            "C-9, Lotus Enclave, Sector 45",
            28.5600,
            77.3400,
            350,
            100,
            4,
            True,
            4,
            None,
        ),
        (
            priya,
            "Water Tank Cleaning",
            "water",
            "Flat 402, Sunrise Residency, Sector 62",
            28.6350,
            77.3650,
            800,
            0,
            11,
            True,
            5,
            "Second time I've booked Ramesh. Always reliable.",
        ),
        (
            amit,
            "Plumbing",
            "water-pump",
            "A-7, Rose Garden Society, Sector 61",
            28.6180,
            77.3610,
            500,
            0,
            19,
            True,
            3,
            "Job done but had to call twice about the timing.",
        ),
    ]

    completed_count = 0
    for (
        customer,
        service,
        icon,
        address,
        lat,
        lng,
        base,
        extra,
        days_ago,
        paid,
        stars,
        feedback,
    ) in history:
        finished = NOW - timedelta(days=days_ago, hours=3)
        started = finished - timedelta(hours=2)

        job = Job(
            customer_id=customer.id,
            worker_id=ramesh.id,
            service_type=service,
            service_icon=icon,
            work_details=f"{service} work completed at {address}.",
            address=address,
            landmark=None,
            lat=lat,
            lng=lng,
            base_amount=base,
            status=JobStatus.COMPLETED,
            requested_at=started - timedelta(minutes=20),
            accepted_at=started,
            completed_at=finished,
        )
        db.add(job)
        db.flush()

        db.add(JobService(job_id=job.id, name=service, price=base))
        db.add_all(
            _events(
                job,
                [
                    (JobStatus.REQUESTED, job.requested_at),
                    (JobStatus.ACCEPTED, started),
                    (JobStatus.ON_THE_WAY, started + timedelta(minutes=5)),
                    (JobStatus.ARRIVED, started + timedelta(minutes=25)),
                    (JobStatus.WORK_STARTED, started + timedelta(minutes=30)),
                    (JobStatus.COMPLETED, finished),
                ],
            )
        )

        if extra:
            db.add(
                ExtraAmountRequest(
                    job_id=job.id,
                    amount=extra,
                    reason="Additional material required on site.",
                    status=ExtraAmountStatus.APPROVED,
                    created_at=started + timedelta(minutes=40),
                    decided_at=started + timedelta(minutes=52),
                )
            )

        db.add(
            Payment(
                job_id=job.id,
                worker_id=ramesh.id,
                base_amount=base,
                extra_amount=extra,
                total_amount=base + extra,
                status=PaymentStatus.PAID if paid else PaymentStatus.PENDING,
                created_at=finished,
                paid_at=finished + timedelta(hours=6) if paid else None,
            )
        )
        db.add(
            Rating(
                job_id=job.id,
                worker_id=ramesh.id,
                customer_id=customer.id,
                stars=stars,
                feedback=feedback,
                created_at=finished + timedelta(hours=1),
            )
        )
        completed_count += 1

    # A rejected job, plus a broadcast request Ramesh has already dismissed — so the
    # "declined" paths have data behind them too.
    rejected = Job(
        customer_id=rahul.id,
        worker_id=ramesh.id,
        service_type="Plumbing",
        service_icon="water-pump",
        work_details="Full bathroom re-piping.",
        address="C-9, Lotus Enclave, Sector 45",
        lat=28.5600,
        lng=77.3400,
        base_amount=4500,
        status=JobStatus.REJECTED,
        reject_reason="Too large for a single visit",
        requested_at=NOW - timedelta(days=3),
    )
    db.add(rejected)
    db.flush()
    db.add(JobService(job_id=rejected.id, name="Bathroom re-piping", price=4500))
    db.add_all(
        _events(
            rejected,
            [
                (JobStatus.REQUESTED, rejected.requested_at),
                (JobStatus.REJECTED, rejected.requested_at + timedelta(minutes=3)),
            ],
        )
    )
    db.add(
        JobRejection(
            job_id=request_two.id,
            worker_id=_anil.id,
            reason="Not my trade",
            created_at=NOW - timedelta(minutes=20),
        )
    )

    # -- aggregates --------------------------------------------------------
    db.flush()
    for worker in workers:
        average, count = db.execute(
            select(func.avg(Rating.stars), func.count(Rating.id)).where(
                Rating.worker_id == worker.id
            )
        ).one()
        worker.rating_avg = round(float(average), 2) if average is not None else 0
        worker.rating_count = count or 0
        worker.completed_jobs = (
            db.scalar(
                select(func.count())
                .select_from(Job)
                .where(Job.worker_id == worker.id, Job.status == JobStatus.COMPLETED)
            )
            or 0
        )

    # -- notifications (spec #12) ------------------------------------------
    db.add_all(
        [
            Notification(
                worker_id=ramesh.id,
                type=NotificationType.NEW_JOB,
                title="New Plumbing request",
                body=f"{priya.name} · Sector 62",
                data={"job_id": request_one.id},
                is_read=False,
                created_at=NOW - timedelta(minutes=6),
            ),
            Notification(
                worker_id=ramesh.id,
                type=NotificationType.CHAT,
                title=f"Message from {amit.name}",
                body="The main valve is near the meter room if you need it.",
                data={"job_id": active.id},
                is_read=False,
                created_at=NOW - timedelta(minutes=9),
            ),
            Notification(
                worker_id=ramesh.id,
                type=NotificationType.PAYMENT,
                title="₹900 paid",
                body="Payment for your Pipe Fitting job has been settled.",
                data={"amount": 900},
                is_read=False,
                created_at=NOW - timedelta(days=2, hours=1),
            ),
            Notification(
                worker_id=ramesh.id,
                type=NotificationType.EXTRA_AMOUNT,
                title="Extra ₹150 approved",
                body="The customer approved your request for Water Tank Cleaning.",
                data={"amount": 150},
                is_read=True,
                created_at=NOW - timedelta(hours=5),
            ),
            Notification(
                worker_id=ramesh.id,
                type=NotificationType.JOB_UPDATE,
                title="5★ from Priya Sharma",
                body="Fixed the leak quickly and cleaned up afterwards. Very polite.",
                data={},
                is_read=True,
                created_at=NOW - timedelta(hours=2),
            ),
            Notification(
                worker_id=suresh.id,
                type=NotificationType.NEW_JOB,
                title="New Plumbing request",
                body=f"{rahul.name} · Sector 45",
                data={"job_id": request_directed.id},
                is_read=False,
                created_at=NOW - timedelta(minutes=12),
            ),
        ]
    )

    db.commit()

    print(f"· 1 society, {len(workers)} workers, {len(customers)} customers")
    print(f"· {completed_count} completed jobs with payments and ratings")
    print("· 3 open requests (2 broadcast, 1 directed at WM1042), 1 job in progress")
    print("\nLogin with the worker code OR the phone number:\n")
    for worker in workers:
        forced = " (will be asked to change it)" if worker.must_change_password else ""
        print(f"    {worker.worker_code:8}  {worker.phone:15}  {INITIAL_PASSWORD}{forced}")
    print()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--reset",
        action="store_true",
        help="delete every row in every table before seeding",
    )
    args = parser.parse_args()

    with SessionLocal() as db:
        existing = db.scalar(select(func.count()).select_from(Worker)) or 0
        if existing and not args.reset:
            print(
                f"Refusing to seed: {existing} workers already exist.\n"
                "Re-run with --reset to wipe and reseed."
            )
            return 1
        if args.reset:
            wipe(db)
        seed(db)

    print("Seed complete.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
