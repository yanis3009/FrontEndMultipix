const API_BASE = "http://localhost:8000";

export async function searchImages({ mode, query, imageFiles }) {
  const formData = new FormData();
  formData.append("mode", mode);
  formData.append("query", query || "");

  if (imageFiles && imageFiles.length > 0) {
    imageFiles.forEach((file) => {
      formData.append("images", file);
    });
  }

  // const res = await fetch(`${API_BASE}/search`, { method: "POST", body: formData });
  // return await res.json();

  console.log("payload /search :", {
    mode,
    query,
    nbImages: imageFiles?.length || 0,
  });
  return { results: [] };
}
export async function uploadImages(files) {
  const formData = new FormData();
  files.forEach((f) => formData.append("files", f));

  // const res = await fetch(`${API_BASE}/upload`, {
  //   method: "POST",
  //   body: formData,
  // });
  // return await res.json();

  console.log("uploadImages payload prêt :", files);
  return { images: [] };
}

export async function askAssistant(message) {
  const formData = new FormData();
  formData.append("message", message);

  // const res = await fetch(`${API_BASE}/assistant`, {
  //   method: "POST",
  //   body: formData,
  // });
  // return await res.json();

  console.log("askAssistant payload prêt :", message);
  return { reply: "Réponse factice de l'assistant (stub)." };
}
