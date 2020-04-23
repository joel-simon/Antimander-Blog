aws s3 sync --acl public-read --sse --delete build s3://www.antimander.org
aws s3 sync --acl public-read --sse --delete  --exclude "*" \
    --include "imgs/*"  --include "icons/*" --include "data/*" --include "fonts/*" . s3://www.antimander.org
