// Referência única ao <audio> global (montado no PlayerProvider).
let el: HTMLAudioElement | null = null;

export const setAudio = (a: HTMLAudioElement | null) => {
  el = a;
};
export const getAudio = () => el;
