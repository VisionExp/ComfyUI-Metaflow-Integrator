export const getToday = () => {
  const nowWithOffset = new Date().getTime() + 3600 * 1000 * 2;
  return new Date(nowWithOffset).toISOString();
};
export const sanitizeDateTime = (date: string | undefined) => {
  return date?.replace('T', ' ').split('.')[0];
};
