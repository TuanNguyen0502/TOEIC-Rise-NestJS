export enum EDays {
  ONE_MONTH = 'ONE_MONTH',
  THREE_MONTHS = 'THREE_MONTHS',
  SIX_MONTHS = 'SIX_MONTHS',
  ONE_YEAR = 'ONE_YEAR',
  TWO_YEARS = 'TWO_YEARS',
  THREE_YEARS = 'THREE_YEARS',
}

export function getDaysValue(days: EDays): number {
  switch (days) {
    case EDays.ONE_MONTH:
      return 30;
    case EDays.THREE_MONTHS:
      return 90;
    case EDays.SIX_MONTHS:
      return 180;
    case EDays.ONE_YEAR:
      return 365;
    case EDays.TWO_YEARS:
      return 720;
    case EDays.THREE_YEARS:
      return 1095;
    default:
      return 30;
  }
}
