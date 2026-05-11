# Frontend Components

## Overview

The Dorm Chores Scheduler frontend uses a reusable component-based structure built with React Native and Expo. The shared components in the `components/` folder are used to keep the user interface consistent, reduce duplication, and make future development easier.

In the current project structure, the main reusable components are:

- `ActionPillButton.tsx`
- `AvailabilityBadge.tsx`
- `BlockButton.tsx`
- `Button.tsx`
- `CategoryPicker.tsx`
- `CurvedBanner.tsx`
- `DormCard.tsx`
- `FilterChip.tsx`
- `HeaderBackButton.tsx`
- `InfoPanel.tsx`
- `InlineButton.tsx`
- `InlineNotification.tsx`
- `Input.tsx`
- `InputCode.tsx`
- `ListItem.tsx`
- `Navbar.tsx`
- `ProfilePicture.tsx`
- `Selector.tsx`
- `SortDropdown.tsx`
- `Spacer.tsx`
- `ToggleItem.tsx`

---

## ActionPillButton

**File:** `components/ActionPillButton.tsx`

### Purpose

A compact pill button with an icon and label, styled for quick actions.

### Props

- `title: string` - the label displayed inside the pill
- `iconName: keyof typeof FontAwesome5.glyphMap` - FontAwesome5 icon name
- `onPress: () => void` - callback triggered on press
- `variant?: 'primary' | 'secondary'` - visual style (default: 'primary')
- `style?: ViewStyle` - custom styles for the outer wrapper
- `disabled?: boolean` - whether the button is disabled (default: false)

### Behaviour

- Supports two visual variants: primary and secondary
- Shows a pressed border highlight
- Uses internal `isPressed` state for visual feedback

### Usage Notes

Ideal for small, secondary actions like "Add Member" or "Join Dorm" that don't require a full-width block button.

---

## AvailabilityBadge

**File:** `components/AvailabilityBadge.tsx`

### Purpose

A pill-shaped availability status button for the top bar that allows users to switch between Available and Unavailable.

### Props

- `isAvailable: boolean` - current availability state
- `onChange: (value: boolean) => void` - called when the user selects a new status
- `readOnly?: boolean` - disables the dropdown interaction
- `style?: ViewStyle` - custom styles for the outer wrapper

### Behaviour

- Tapping opens a dropdown menu to switch status
- Anchors to the right and expands leftward as text grows
- Saves status changes using `lib/availability`
- Supports a loading state during hydration

### Usage Notes

Typically placed in the header of the app to allow users to quickly toggle their status.

---

## BlockButton

**File:** `components/BlockButton.tsx`

### Purpose

A quick-action block button styled as a rounded tile with a large icon and label.

### Props

- `title: string` - the label displayed below the icon
- `iconName: keyof typeof FontAwesome5.glyphMap` - FontAwesome5 icon name
- `onPress: () => void` - callback triggered on press
- `style?: ViewStyle` - custom styles for the outer wrapper
- `disabled?: boolean` - whether the button is disabled

### Behaviour

- Renders as a fixed-size tile (170x74)
- Consistent press highlight border effect
- Supports a disabled state with dimmed colours

### Usage Notes

Used on dashboard screens for high-priority actions like "Create Chore" or "Request Repair".

---

## Button

**File:** `components/Button.tsx`

### Purpose

Provides a reusable button for primary and secondary actions across the app.

### Props

- `title: string` - text shown on the button
- `onPress: () => void` - function called when the button is pressed
- `variant?: 'standard' | 'secondary' | 'tertiary' | 'danger'` - visual style
- `style?: ViewStyle` - optional wrapper styling
- `textStyle?: TextStyle` - optional text styling
- `disabled?: boolean` - disables interaction when true

### Behaviour

- Uses four visual variants: standard, secondary, tertiary, and danger
- Supports a disabled state
- Shows a pressed border highlight using internal `isPressed` state
- Uses shared colours from `constants/colours`

### Usage Notes

This component should be used instead of creating one-off buttons in pages, so button styling remains consistent across the app.

---

## CategoryPicker

**File:** `components/CategoryPicker.tsx`

### Purpose

A wrapping row of pill-shaped category chips for selecting a single chore category.

### Props

- `options: CategoryOption[]` - array of `{ key, label, iconName }` objects
- `selected: string | null` - the key of the currently selected chip
- `onSelect: (key: string) => void` - callback triggered when a chip is pressed
- `style?: ViewStyle` - custom styles for the container

### Behaviour

- Active chip has a dark green background with light green text
- Inactive chip has a transparent background with a grey border
- Icons match the text colour of the chip

### Usage Notes

Use this when the user needs to select a category for a chore or filter.

---

## CurvedBanner

**File:** `components/CurvedBanner.tsx`

### Purpose

Provides the decorative curved banner used at the top of screens, especially authentication screens.

### Props

- `variant?: 'large' | 'medium' | 'small'`
- `height?: number`
- `style?: ViewStyle`

### Behaviour

- Renders a curved ellipse-like shape using a styled `View`
- Supports predefined size variants
- Supports optional height override
- Used for visual branding and layout hierarchy

### Usage Notes

This component is primarily decorative and should be reused anywhere the app needs the same branded header style.

---

## DormCard

**File:** `components/DormCard.tsx`

### Purpose

A full-width card displaying dorm information, statistics, and action buttons.

### Props

- `title: string` - main dorm name
- `subtitle: string` - supporting context line
- `stats: { value: string | number; label: string }[]` - array of stat pills
- `primaryAction: { label: string; onPress: () => void; variant?: 'primary' | 'secondary' }`
- `secondaryAction?: { label: string; onPress: () => void; variant?: 'primary' | 'secondary' }`
- `style?: ViewStyle` - optional container overrides

### Behaviour

- Displays stats as prominent pills with labels
- Supports up to two action buttons with different variants (primary, secondary, danger)
- Handles text truncation for long titles and subtitles

### Usage Notes

Primary component for the Dorms list page.

---

## FilterChip

**File:** `components/FilterChip.tsx`

### Purpose

A pill-shaped filter chip component for filtering lists.

### Props

- `label: string` - text displayed inside the chip
- `active?: boolean` - whether the chip is in the active/selected state
- `onPress: () => void` - callback triggered on press
- `style?: ViewStyle` - custom styles for the outer wrapper

### Behaviour

- Active state uses a dark green background
- Inactive state uses a transparent background with a grey border

### Usage Notes

Used for filtering chores or other lists by status or ownership.

---

## HeaderBackButton

**File:** `components/HeaderBackButton.tsx`

### Purpose

Provides a reusable back-navigation button for page headers.

### Props

- `onPress?: () => void`
- `style?: object`
- `iconColor?: string`
- `backgroundColor?: string`
- `iconName?: keyof FontAwesome5.glyphMap`

### Behaviour

- Uses Expo Router navigation by default
- Falls back to `router.back()` when no custom `onPress` is supplied
- Supports icon and colour customisation

### Usage Notes

Use this component in screens that need a consistent back button rather than creating custom navigation controls in each page.

---

## InfoPanel

**File:** `components/InfoPanel.tsx`

### Purpose

A stat display tile showing a label and a large prominent value.

### Props

- `label: string` - descriptor shown above the value
- `value: string | number` - large prominent figure
- `style?: ViewStyle` - custom styles for the outer wrapper
- `labelStyle?: TextStyle` - custom label styling
- `valueStyle?: TextStyle` - custom value styling

### Behaviour

- Default width is 48% to fit two panels side-by-side
- Fixed height of 100 with rounded corners

### Usage Notes

Ideal for dashboard metrics like "Total chores" or "Completion rate".

---

## InlineButton

**File:** `components/InlineButton.tsx`

### Purpose

Provides a lightweight button that can be placed inline with normal text.

### Behaviour

- Intended for smaller actions embedded in sentences or helper text
- Suitable for links such as “Reset password” or “Sign up”

### Usage Notes

This component is best used inside text blocks where a full-sized button would be visually too heavy.

---

## InlineNotification

**File:** `components/InlineNotification.tsx`

### Purpose

Displays short inline feedback messages such as success, warning, or error messages.

### Behaviour

- Designed for contextual messaging inside forms and page content
- Can be used with validation results or status feedback

### Usage Notes

This component should be used to surface validation or action feedback close to the relevant UI element.

---

## Input

**File:** `components/Input.tsx`

### Purpose

Provides a reusable text input field for forms.

### Common Usage

- Email input
- Password input
- General text entry

### Behaviour

- Accepts user text input
- Supports secure text entry for password fields
- Used in authentication forms such as sign-in

### Usage Notes

This component should be the default input used in forms so that spacing, colours, and text behaviour remain consistent.

---

## InputCode

**File:** `components/InputCode.tsx`

### Purpose

Provides an input field designed for code entry, such as verification or reset codes.

### Behaviour

- Intended for short structured values
- Likely to be used in password reset or account verification flows

### Usage Notes

Use this component when the user is entering a short code rather than free-form text.

---

## ListItem

**File:** `components/ListItem.tsx`

### Purpose

Provides a reusable list row for displaying structured content such as chores, repair items, or other records.

### Behaviour

- Supports repeated list-based page layouts
- Helps standardise item presentation across the app

### Usage Notes

This component should be used in pages that render collections of records so that lists have a consistent visual pattern.

---

## Navbar

**File:** `components/Navbar.tsx`

### Purpose

A bottom navigation bar with icon-and-label tab buttons.

### Props

- `items: NavBarItem[]` - array of 2-4 navigation items
- `activeKey: string` - the `key` of the currently active tab
- `style?: ViewStyle` - custom styles for the outer container

### Behaviour

- Displays up to 4 items evenly spaced
- Active tabs are highlighted and non-interactable
- Uses FontAwesome5 icons

### Usage Notes

Used as the global navigation component at the bottom of the screen.

---

## ProfilePicture

**File:** `components/ProfilePicture.tsx`

### Purpose

A circular profile picture component with size variants and image upload capabilities.

### Props

- `variant: 'small' | 'large'` - size and behaviour mode
- `imageUri?: string` - remote or local URI for the image
- `onPress?: () => void` - (small only) called when tapped
- `onImageChange?: (uri: string) => void` - (large only) called after successful upload
- `style?: ViewStyle` - custom styles for the outer wrapper

### Behaviour

- `small` variant acts as a navigation button
- `large` variant includes a camera overlay for picking and uploading a new photo
- Falls back to a placeholder silhouette if no image is provided

### Usage Notes

Use the `small` variant in the header and the `large` variant on the profile page.

---

## Selector

**File:** `components/Selector.tsx`

### Purpose

Provides a reusable option selector using card-style items.

### Props

- `options` - array of selectable options
- `selectedId` - currently selected option id
- `onSelect` - callback when an option is selected

### Behaviour

- Renders selectable option cards
- Highlights the selected card with a thicker border and focus colour
- Uses icon, title, and subtitle content for each option

### Usage Notes

This component is useful when the user must choose one option from a small predefined set.

---

## SortDropdown

**File:** `components/SortDropdown.tsx`

### Purpose

A pill-shaped sort chip that opens a modal dropdown with options.

### Props

- `options: string[]` - list of sort options
- `selected: string` - the currently selected option
- `onSelect: (option: string) => void` - callback when an option is picked
- `style?: ViewStyle` - custom styles for the outer wrapper

### Behaviour

- Displays the selected option with a chevron-down icon
- Opens a full-screen overlay with a selection menu at the bottom
- Highlights the currently selected option in the menu

### Usage Notes

Used to change the sort order of chore or repair lists.

---

## Spacer

**File:** `components/Spacer.tsx`

### Purpose

Provides consistent vertical spacing between UI elements.

### Props

- `size?: 'large' | 'medium' | 'small'`
- `height?: number`
- `style?: ViewStyle`

### Behaviour

- Supports predefined spacing sizes
- Allows a custom height override
- Helps keep layout spacing consistent across screens

### Usage Notes

Use `Spacer` instead of hardcoding random margins between components.

---

## ToggleItem

**File:** `components/ToggleItem.tsx`

### Purpose

A toggleable list item component with an optional icon and custom toggle switch.

### Props

- `title: string` - main label text
- `iconName?: keyof FontAwesome5.glyphMap` - optional icon
- `value: boolean` - current toggle state
- `onValueChange: (value: boolean) => void` - callback when toggled
- `disabled?: boolean` - disables interaction and dims the item
- `style?: object` - custom styles for the container

### Behaviour

- Includes a smooth spring-animated toggle switch
- Supports an icon-less variant
- Matches the height and style of `ListItem` when an icon is provided

### Usage Notes

Best used for settings or preferences pages.

---

## Component Design Summary

The current component system improves the project in four main ways:

1. **Reusability** - shared UI patterns only need to be implemented once
2. **Consistency** - pages use the same interaction and styling rules
3. **Maintainability** - UI updates can be made in one place
4. **Scalability** - future pages can reuse the same building blocks
