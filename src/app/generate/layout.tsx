import { NavigationGeneratingProvider } from "@/components/navigation-generating-context";

/**
 * Fills the area below the header so the Generate UI can stretch to the viewport.
 */
export default function GenerateLayout({ children }: { children: React.ReactNode }) {
  return (
    <NavigationGeneratingProvider>
      <div className="flex min-h-0 w-full flex-1 flex-col">{children}</div>
    </NavigationGeneratingProvider>
  );
}
