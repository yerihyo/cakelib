export default class ImageTool {
  /**
   * 이미지 dataURL 을 다운스케일 + JPEG 재인코딩하여 용량 절감.
   * 이미지가 아닌 dataURL 은 그대로 반환 (no-op).
   * 이미 max_dim 이하 + 이미 JPEG 면 skip.
   */
  static dataurl2jpeg_compressed = async (
    dataurl: string,
    opts?: { max_dim?: number; quality?: number },
  ): Promise<string> => {
    if (!dataurl?.startsWith("data:image/")) return dataurl;

    const max_dim = opts?.max_dim ?? 1600;
    const quality = opts?.quality ?? 0.9;

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = reject;
      im.src = dataurl;
    });

    if (img.width <= max_dim && img.height <= max_dim && dataurl.startsWith("data:image/jpeg")) {
      return dataurl;
    }

    const scale = Math.min(1, max_dim / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataurl;
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", quality);
  };
}
