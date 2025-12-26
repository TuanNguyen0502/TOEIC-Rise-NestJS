export class DateRange {
  start: Date;
  end: Date;
}

export class DateRangeUtil {
  static previousPeriod(startDate: Date, endDate: Date): DateRange {
    // Convert to LocalDate equivalent (just date, no time)
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    // Calculate days difference
    const days =
      Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Calculate previous period
    const previousEnd = new Date(start);
    previousEnd.setDate(previousEnd.getDate() - 1);

    const previousStart = new Date(previousEnd);
    previousStart.setDate(previousStart.getDate() - (days - 1));

    return {
      start: previousStart,
      end: previousEnd,
    };
  }
}
