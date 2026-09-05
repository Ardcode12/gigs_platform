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

export const JOB_STEPS = ['step.accepted', 'step.onTheWay', 'step.arrived', 'step.workStarted', 'step.completed'];

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
  [JOB_STATUS.ACCEPTED]: { status: JOB_STATUS.ON_THE_WAY, label: 'action.onTheWay', icon: 'bike-fast' },
  [JOB_STATUS.ON_THE_WAY]: { status: JOB_STATUS.ARRIVED, label: 'action.arrived', icon: 'map-marker-check' },
  [JOB_STATUS.ARRIVED]: { status: JOB_STATUS.WORK_STARTED, label: 'action.startWork', icon: 'play-circle' },
  [JOB_STATUS.WORK_STARTED]: { status: JOB_STATUS.COMPLETED, label: 'action.completeWork', icon: 'check-circle' },
};

export const STATUS_LABEL = {
  [JOB_STATUS.REQUESTED]: 'status.requested', [JOB_STATUS.ACCEPTED]: 'status.accepted', [JOB_STATUS.ON_THE_WAY]: 'status.on_the_way', [JOB_STATUS.ARRIVED]: 'status.arrived', [JOB_STATUS.WORK_STARTED]: 'status.work_started', [JOB_STATUS.COMPLETED]: 'status.completed', [JOB_STATUS.REJECTED]: 'status.rejected', [JOB_STATUS.CANCELLED]: 'status.cancelled',
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
