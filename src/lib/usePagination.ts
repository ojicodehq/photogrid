import { useCallback, useMemo } from "react";

import { usePhotoGridStore } from "@/lib/store";

/**
 * Hook de pagination.
 * Encapsule la logique de navigation inter-pages pour la grille.
 */
export function usePagination() {
  const photos = usePhotoGridStore((s) => s.photos);
  const layout = usePhotoGridStore((s) => s.layout);
  const currentPage = usePhotoGridStore((s) => s.currentPage);
  const setCurrentPage = usePhotoGridStore((s) => s.setCurrentPage);

  const photosPerPage = useMemo(
    () => Math.max(1, layout.rows * layout.columns),
    [layout.rows, layout.columns],
  );

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(photos.length / photosPerPage)),
    [photos.length, photosPerPage],
  );

  const canGoPrev = currentPage > 0;
  const canGoNext = currentPage < totalPages - 1;

  const goToNextPage = useCallback(() => {
    if (canGoNext) setCurrentPage(currentPage + 1);
  }, [canGoNext, currentPage, setCurrentPage]);

  const goToPrevPage = useCallback(() => {
    if (canGoPrev) setCurrentPage(currentPage - 1);
  }, [canGoPrev, currentPage, setCurrentPage]);

  const goToPage = useCallback(
    (page: number) => setCurrentPage(page),
    [setCurrentPage],
  );

  const currentPagePhotos = useMemo(() => {
    const start = currentPage * photosPerPage;
    return photos.slice(start, start + photosPerPage);
  }, [currentPage, photosPerPage, photos]);

  return {
    currentPage,
    totalPages,
    photosPerPage,
    currentPagePhotos,
    canGoPrev,
    canGoNext,
    goToNextPage,
    goToPrevPage,
    goToPage,
  };
}
