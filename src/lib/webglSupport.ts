export function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const options = { failIfMajorPerformanceCaveat: false };
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl2', options) || canvas.getContext('webgl', options))
    );
  } catch (e) {
    return false;
  }
}
