current architectur suffers from "Prop Drilling" and "God Objects" (passing the entire state and actions objects). This makes components harder to test and causes unnecessary re-renders.

Reviewing GalleryView (Specific Better Practices)
The GalleryView is currently doing too much (Image Grid + Text Editor + Canon List). In Next.js/React practice, this should be broken down.

Improvements for GalleryView:

TextArea Optimization: Use a library like react-textarea-autosize. Standard textareas with min-h-[180px] create awkward scrolling on mobile devices with small screens.

Canon List (Radix UI ToggleGroup): The "Issuer Canons" buttons are a perfect candidate for Radix UI ToggleGroup. This handles the "isSelected" styling and ARIA attributes automatically.