# Future Capacitor Android Plan

The current app remains a Progressive Web App for alpha testing. Capacitor can later package the same app as an Android app without rebuilding the product.

## Keep Stable

- Keep household data in `householdAssistant.userData.v1` until a tested migration exists.
- Keep Supabase Auth client-side with only the publishable or anon key.
- Keep all private database protection in Supabase Row Level Security.
- Keep backup/export/import available before and after the wrapper.

## Later Steps

1. Add Capacitor to the project.
2. Point Capacitor at the existing built PWA files.
3. Add Android app icons and splash assets.
4. Test install, update and uninstall behaviour on physical phones.
5. Confirm existing PWA data migration before any Play Store beta.
6. Add native notification support only after the web notification flow is stable.

## Do Not Do

- Do not place a Supabase service_role key in the Android app.
- Do not hard-code private household IDs or real household data.
- Do not remove browser/PWA testing until the Android wrapper is proven stable.
