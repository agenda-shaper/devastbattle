import { curry2, curry3, findIndex, removeAll } from '@most/prelude';

/** @license MIT License (c) copyright 2010-2017 original author or authors */

var ScheduledTask = function ScheduledTask (time, localOffset, period, task, scheduler) {
  this.time = time;
  this.localOffset = localOffset;
  this.period = period;
  this.task = task;
  this.scheduler = scheduler;
  this.active = true;
};

ScheduledTask.prototype.run = function run () {
  return this.task.run(this.time - this.localOffset)
};

ScheduledTask.prototype.error = function error (e) {
  return this.task.error(this.time - this.localOffset, e)
};

ScheduledTask.prototype.dispose = function dispose () {
  this.scheduler.cancel(this);
  return this.task.dispose()
};

var RelativeScheduler = function RelativeScheduler (origin, scheduler) {
  this.origin = origin;
  this.scheduler = scheduler;
};

RelativeScheduler.prototype.currentTime = function currentTime () {
  return this.scheduler.currentTime() - this.origin
};

RelativeScheduler.prototype.scheduleTask = function scheduleTask (localOffset, delay, period, task) {
  return this.scheduler.scheduleTask(localOffset + this.origin, delay, period, task)
};

RelativeScheduler.prototype.relative = function relative (origin) {
  return new RelativeScheduler(origin + this.origin, this.scheduler)
};

RelativeScheduler.prototype.cancel = function cancel (task) {
  return this.scheduler.cancel(task)
};

RelativeScheduler.prototype.cancelAll = function cancelAll (f) {
  return this.scheduler.cancelAll(f)
};

/** @license MIT License (c) copyright 2010-2017 original author or authors */

var defer = function (task) { return Promise.resolve(task).then(runTask); };

function runTask (task) {
  try {
    return task.run()
  } catch (e) {
    return task.error(e)
  }
}

/** @license MIT License (c) copyright 2010-2017 original author or authors */

var Scheduler = function Scheduler (timer, timeline) {
  var this$1 = this;

  this.timer = timer;
  this.timeline = timeline;

  this._timer = null;
  this._nextArrival = Infinity;

  this._runReadyTasksBound = function () { return this$1._runReadyTasks(this$1.currentTime()); };
};

Scheduler.prototype.currentTime = function currentTime () {
  return this.timer.now()
};

Scheduler.prototype.scheduleTask = function scheduleTask (localOffset, delay, period, task) {
  var time = this.currentTime() + Math.max(0, delay);
  var st = new ScheduledTask(time, localOffset, period, task, this);

  this.timeline.add(st);
  this._scheduleNextRun();
  return st
};

Scheduler.prototype.relative = function relative (offset) {
  return new RelativeScheduler(offset, this)
};

Scheduler.prototype.cancel = function cancel (task) {
  task.active = false;
  if (this.timeline.remove(task)) {
    this._reschedule();
  }
};

Scheduler.prototype.cancelAll = function cancelAll (f) {
  this.timeline.removeAll(f);
  this._reschedule();
};

Scheduler.prototype._reschedule = function _reschedule () {
  if (this.timeline.isEmpty()) {
    this._unschedule();
  } else {
    this._scheduleNextRun(this.currentTime());
  }
};

Scheduler.prototype._unschedule = function _unschedule () {
  this.timer.clearTimer(this._timer);
  this._timer = null;
};

Scheduler.prototype._scheduleNextRun = function _scheduleNextRun () { // eslint-disable-line complexity
  if (this.timeline.isEmpty()) {
    return
  }

  var nextArrival = this.timeline.nextArrival();

  if (this._timer === null) {
    this._scheduleNextArrival(nextArrival);
  } else if (nextArrival < this._nextArrival) {
    this._unschedule();
    this._scheduleNextArrival(nextArrival);
  }
};

Scheduler.prototype._scheduleNextArrival = function _scheduleNextArrival (nextArrival) {
  this._nextArrival = nextArrival;
  var delay = Math.max(0, nextArrival - this.currentTime());
  this._timer = this.timer.setTimer(this._runReadyTasksBound, delay);
};

Scheduler.prototype._runReadyTasks = function _runReadyTasks () {
  this._timer = null;
  this.timeline.runTasks(this.currentTime(), runTask);
  this._scheduleNextRun();
};

/** @license MIT License (c) copyright 2010-2017 original author or authors */

var Timeline = function Timeline () {
  this.tasks = [];
};

Timeline.prototype.nextArrival = function nextArrival () {
  return this.isEmpty() ? Infinity : this.tasks[0].time
};

Timeline.prototype.isEmpty = function isEmpty () {
  return this.tasks.length === 0
};

Timeline.prototype.add = function add (st) {
  insertByTime(st, this.tasks);
};

Timeline.prototype.remove = function remove (st) {
  var i = binarySearch(getTime(st), this.tasks);

  if (i >= 0 && i < this.tasks.length) {
    var at = findIndex(st, this.tasks[i].events);
    if (at >= 0) {
      this.tasks[i].events.splice(at, 1);
      return true
    }
  }

  return false
};

Timeline.prototype.removeAll = function removeAll$$1 (f) {
    var this$1 = this;

  for (var i = 0; i < this.tasks.length; ++i) {
    removeAllFrom(f, this$1.tasks[i]);
  }
};

Timeline.prototype.runTasks = function runTasks (t, runTask) {
    var this$1 = this;

  var tasks = this.tasks;
  var l = tasks.length;
  var i = 0;

  while (i < l && tasks[i].time <= t) {
    ++i;
  }

  this.tasks = tasks.slice(i);

  // Run all ready tasks
  for (var j = 0; j < i; ++j) {
    this$1.tasks = runReadyTasks(runTask, tasks[j].events, this$1.tasks);
  }
};

function runReadyTasks (runTask, events, tasks) { // eslint-disable-line complexity
  for (var i = 0; i < events.length; ++i) {
    var task = events[i];

    if (task.active) {
      runTask(task);

      // Reschedule periodic repeating tasks
      // Check active again, since a task may have canceled itself
      if (task.period >= 0 && task.active) {
        task.time = task.time + task.period;
        insertByTime(task, tasks);
      }
    }
  }

  return tasks
}

function insertByTime (task, timeslots) {
  var l = timeslots.length;
  var time = getTime(task);

  if (l === 0) {
    timeslots.push(newTimeslot(time, [task]));
    return
  }

  var i = binarySearch(time, timeslots);

  if (i >= l) {
    timeslots.push(newTimeslot(time, [task]));
  } else {
    insertAtTimeslot(task, timeslots, time, i);
  }
}

function insertAtTimeslot (task, timeslots, time, i) {
  var timeslot = timeslots[i];
  if (time === timeslot.time) {
    addEvent(task, timeslot.events, time);
  } else {
    timeslots.splice(i, 0, newTimeslot(time, [task]));
  }
}

function addEvent (task, events) {
  if (events.length === 0 || task.time >= events[events.length - 1].time) {
    events.push(task);
  } else {
    spliceEvent(task, events);
  }
}

function spliceEvent (task, events) {
  for (var j = 0; j < events.length; j++) {
    if (task.time < events[j].time) {
      events.splice(j, 0, task);
      break
    }
  }
}

function getTime (scheduledTask) {
  return Math.floor(scheduledTask.time)
}

function removeAllFrom (f, timeslot) {
  timeslot.events = removeAll(f, timeslot.events);
}

function binarySearch (t, sortedArray) { // eslint-disable-line complexity
  var lo = 0;
  var hi = sortedArray.length;
  var mid, y;

  while (lo < hi) {
    mid = Math.floor((lo + hi) / 2);
    y = sortedArray[mid];

    if (t === y.time) {
      return mid
    } else if (t < y.time) {
      hi = mid;
    } else {
      lo = mid + 1;
    }
  }
  return hi
}

var newTimeslot = function (t, events) { return ({ time: t, events: events }); };

/** @license MIT License (c) copyright 2010-2017 original author or authors */

/* global setTimeout, clearTimeout */

var ClockTimer = function ClockTimer (clock) {
  this._clock = clock;
};

ClockTimer.prototype.now = function now () {
  return this._clock.now()
};

ClockTimer.prototype.setTimer = function setTimer (f, dt) {
  return dt <= 0 ? runAsap(f) : setTimeout(f, dt)
};

ClockTimer.prototype.clearTimer = function clearTimer (t) {
  return t instanceof Asap ? t.cancel() : clearTimeout(t)
};

var Asap = function Asap (f) {
  this.f = f;
  this.active = true;
};

Asap.prototype.run = function run () {
  return this.active && this.f()
};

Asap.prototype.error = function error (e) {
  throw e
};

Asap.prototype.cancel = function cancel () {
  this.active = false;
};

function runAsap (f) {
  var task = new Asap(f);
  defer(task);
  return task
}

/** @license MIT License (c) copyright 2010-2017 original author or authors */

/* global performance, process */

var RelativeClock = function RelativeClock (clock, origin) {
  this.origin = origin;
  this.clock = clock;
};

RelativeClock.prototype.now = function now () {
  return this.clock.now() - this.origin
};

var HRTimeClock = function HRTimeClock (hrtime, origin) {
  this.origin = origin;
  this.hrtime = hrtime;
};

HRTimeClock.prototype.now = function now () {
  var hrt = this.hrtime(this.origin);
  return (hrt[0] * 1e9 + hrt[1]) / 1e6
};

var clockRelativeTo = function (clock) { return new RelativeClock(clock, clock.now()); };

var newPerformanceClock = function () { return clockRelativeTo(performance); };

var newDateClock = function () { return clockRelativeTo(Date); };

var newHRTimeClock = function () { return new HRTimeClock(process.hrtime, process.hrtime()); };

var newPlatformClock = function () {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return newPerformanceClock()
  } else if (typeof process !== 'undefined' && typeof process.hrtime === 'function') {
    return newHRTimeClock()
  }

  return newDateClock()
};

// Read the current time from the provided Scheduler
var currentTime = function (scheduler) { return scheduler.currentTime(); };

// Schedule a task to run as soon as possible, but
// not in the current call stack
var asap = curry2(function (task, scheduler) { return scheduler.scheduleTask(0, 0, -1, task); });

// Schedule a task to run after a millisecond delay
var delay = curry3(function (delay, task, scheduler) { return scheduler.scheduleTask(0, delay, -1, task); });

// Schedule a task to run periodically, with the
// first run starting asap
var periodic = curry3(function (period, task, scheduler) { return scheduler.scheduleTask(0, 0, period, task); });

// Cancel a scheduledTask
var cancelTask = function (scheduledTask) { return scheduledTask.dispose(); };

// Cancel all ScheduledTasks for which a predicate
// is true
var cancelAllTasks = curry2(function (predicate, scheduler) { return scheduler.cancelAll(predicate); });

var schedulerRelativeTo = curry2(function (offset, scheduler) { return new RelativeScheduler(offset, scheduler); });

/** @license MIT License (c) copyright 2010-2017 original author or authors */

var newScheduler = curry2(function (timer, timeline) { return new Scheduler(timer, timeline); });

var newDefaultScheduler = function () { return new Scheduler(newDefaultTimer(), new Timeline()); };

var newDefaultTimer = function () { return new ClockTimer(newPlatformClock()); };
var newClockTimer = function (clock) { return new ClockTimer(clock); };

var newTimeline = function () { return new Timeline(); };

export { newScheduler, newDefaultScheduler, newDefaultTimer, newClockTimer, newTimeline, RelativeClock, HRTimeClock, clockRelativeTo, newPerformanceClock, newDateClock, newHRTimeClock, newPlatformClock, currentTime, asap, delay, periodic, cancelTask, cancelAllTasks, schedulerRelativeTo };
//# sourceMappingURL=index.es.js.map
