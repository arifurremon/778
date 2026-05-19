#!/bin/bash

# Create and checkout new branch
echo "🔄 Creating feature branch: auth-ui-modernization..."
git checkout -b auth-ui-modernization

# Add all changes
echo "📝 Adding all changes to git..."
git add .

# Commit changes with descriptive message
echo "💾 Committing changes..."
git commit -m "feat: modernize auth UI with light mode, glassmorphism, and updated signup form

- Updated signup form with password confirmation validation
- Changed design background to #137ece blue with city overlay
- Removed preferredName field, added optional profession field
- Implemented 2-second branded splash screen with logo animation
- Updated login form with modern styling
- Added professional typography and spacing
- Implemented light mode as default theme
- Updated Prisma schema to reflect new user fields
- Fixed Auth.js configuration for Edge compatibility
- Added responsive form validation with Zod

BREAKING CHANGE: preferredName removed from User model, profession field added
"

# Display current branch
echo ""
echo "✅ Branch created and changes committed!"
echo "Current branch: $(git branch --show-current)"
echo ""
echo "📤 Next steps:"
echo "1. Push this branch: git push origin auth-ui-modernization"
echo "2. Create PR: gh pr create --base main --head auth-ui-modernization"
echo ""
