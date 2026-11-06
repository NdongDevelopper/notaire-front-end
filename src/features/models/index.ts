// index.ts — point d'entrée du module Modèles d'actes

// Pages
export { default as ModelsLibraryPage } from "./pages/ModelsLibraryPage";

// Composants
export { default as CategoryFilter } from "./components/CategoryFilter";
export { default as ModelCard } from "./components/ModelCard";
export { default as ModelDetailsModal } from "./components/ModelDetailsModal";

// Services
export * from "./services/modelsApi";

// Types
export * from "./types/models";
