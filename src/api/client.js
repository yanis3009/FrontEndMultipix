const API_BASE = "http://localhost:8000";

export async function searchImages(payload) {
  const {
    mode,
    query,
    imageFiles,
    tags,
    filters,
    faceQueryImages,
  } = payload;

  const formData = new FormData();
  formData.append("mode", mode);
  formData.append("query", query || "");

  // images de base (shootings sélectionnés / query images / etc.)
  if (imageFiles && imageFiles.length > 0) {
    imageFiles.forEach((file) => {
      formData.append("images", file);
    });
  }

  // visages de requête pour filter_union / filter_intersection
  if (faceQueryImages && faceQueryImages.length > 0) {
    faceQueryImages.forEach((file) => {
      formData.append("face_images", file);
    });
  }

  // tags en JSON
  if (tags && tags.length > 0) {
    formData.append("tags", JSON.stringify(tags));
  }

  // filters (dates, orientation, shootIds, faceFilterMode, etc.) en JSON
  if (filters) {
    formData.append("filters", JSON.stringify(filters));
  }

  // const res = await fetch(`${API_BASE}/search`, { method: "POST", body: formData });
  // return await res.json();

  console.log("searchImages payload prêt :", {
    mode,
    query,
    imageFilesCount: imageFiles?.length || 0,
    faceQueryImagesCount: faceQueryImages?.length || 0,
    tags,
    filters,
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
