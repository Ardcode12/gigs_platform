/**
 * Job status vocabulary, shared with the backend's JobStatus enum.
 *
 * `JOB_STEPS` is the ordered happy path, and its indices are exactly the
 * `current_step` the API returns — so StepperProgress needs no translation.
 */

export const JOB_STATUS = {
  REQUESTED: 'requested',
  ACCEPTED: 'accepted',
  ON_THE_WAY: 'on_the_way',
  ARRIVED: 'arrived',
  WORK_STARTED: 'work_started',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
};

export const JOB_STEPS = ['Accepted', 'On The Way', 'Arrived', 'Work Started', 'Completed'];

/** The status each step of the stepper corresponds to. */
export const STEP_STATUS = [
  JOB_STATUS.ACCEPTED,
  JOB_STATUS.ON_THE_WAY,
  JOB_STATUS.ARRIVED,
  JOB_STATUS.WORK_STARTED,
  JOB_STATUS.COMPLETED,
];

/** What the primary button says when the job is in a given status. */
export const NEXT_ACTION = {
  [JOB_STATUS.ACCEPTED]: { status: JOB_STATUS.ON_THE_WAY, label: "I'm On The Way", icon: 'bike-fast' },
  [JOB_STATUS.ON_THE_WAY]: { status: JOB_STATUS.ARRIVED, label: 'I Have Arrived', icon: 'map-marker-check' },
  [JOB_STATUS.ARRIVED]: { status: JOB_STATUS.WORK_STARTED, label: 'Start Work', icon: 'play-circle' },
  [JOB_STATUS.WORK_STARTED]: { status: JOB_STATUS.COMPLETED, label: 'Complete Work', icon: 'check-circle' },
};

export const STATUS_LABEL = {
  [JOB_STATUS.REQUESTED]: 'New Request',
  [JOB_STATUS.ACCEPTED]: 'Accepted',
  [JOB_STATUS.ON_THE_WAY]: 'On The Way',
  [JOB_STATUS.ARRIVED]: 'Arrived',
  [JOB_STATUS.WORK_STARTED]: 'In Progress',
  [JOB_STATUS.COMPLETED]: 'Completed',
  [JOB_STATUS.REJECTED]: 'Rejected',
  [JOB_STATUS.CANCELLED]: 'Cancelled',
};

/** Maps a status onto a StatusBadge colour name. */
export const STATUS_TONE = {
  [JOB_STATUS.REQUESTED]: 'warning',
  [JOB_STATUS.ACCEPTED]: 'info',
  [JOB_STATUS.ON_THE_WAY]: 'info',
  [JOB_STATUS.ARRIVED]: 'primary',
  [JOB_STATUS.WORK_STARTED]: 'primary',
  [JOB_STATUS.COMPLETED]: 'success',
  [JOB_STATUS.REJECTED]: 'danger',
  [JOB_STATUS.CANCELLED]: 'neutral',
};

export const ACTIVE_STATUSES = [
  JOB_STATUS.ACCEPTED,
  JOB_STATUS.ON_THE_WAY,
  JOB_STATUS.ARRIVED,
  JOB_STATUS.WORK_STARTED,
];
