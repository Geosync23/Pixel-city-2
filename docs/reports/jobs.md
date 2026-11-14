# Jobs — notes (header of src/sim/jobs.js; work loops in src/sim/_jobs_work.js; UI src/ui/jobs.js)
- `G.jobs`: listings('computer'|'phone'), apply(jobId), quit(), current() -> {id, jobId, name, level, title, hourly, progress, nextShift, venue, onShift, ...}|null, onShift(), shift(), clockIn(), autoWork(), leaveEarly(),
  openBoard(), openGigs(), gigs(source), acceptGig(id), discount(venueId), perks(), debugStart(jobId, level?), debugStep(), debugFinish().
- Events: job:hired(jobId, level), job:quit, job:shift:start(jobId, shift), job:shift:end(summary), job:promoted(jobId, level), job:missed, job:task(jobId, taskId, quality), job:gig:start/done.
- Clock-in is automatic on entering the workplace room in the shift window. Shift clock runs 2 game-min/sec. Shifts are planner appointments kind 'work' + a `job_shift` opportunity in G.goals.
