# **App Name**: Shamir's Sentinel

## Core Features:

- JSON Input: Read Shamir secret sharing parameters (n, k, shares) from a JSON file.
- Polynomial Reconstruction: Implement the polynomial interpolation to find a constant.
- Modular Arithmetic: Write functions to perform field arithmetic to reconstruct the polynomial constant from the given shares. Should work for large numbers.
- Invalid Share Detection: Implement functions to detect and filter out potentially invalid secret shares. These will not involve a tool.
- Secret Calculation: Calculate the shared secret once all correct shares have been provided and validated.
- Secret Output: Display the reconstructed secret value. Use a formatted display to ensure clarity of the large numbers

## Style Guidelines:

- Primary color: HSL(220, 70%, 50%) -> RGB(#3D84A8) - A reliable blue to reflect security and trust.
- Background color: HSL(220, 20%, 95%) -> RGB(#F0F4F7) - Very light tint of blue for a clean backdrop.
- Accent color: HSL(190, 80%, 40%) -> RGB(#148F77) - Tealish green for interactive elements and success states.
- Font pairing: 'Space Grotesk' (sans-serif) for headings, and 'Inter' (sans-serif) for body text.
- Use outline icons to represent the different function options within the application.
- Employ a clean, modular design that presents functions, input fields, and the final secret in distinct, well-defined sections.