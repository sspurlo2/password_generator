cd extension/tests
rm *.json
echo "Existing test result files have been removed. Generating new result files...."
cd ..
cd ..
node extension/tests/random_generation_test.js
node extension/tests/passphrase_generation_test.js
echo "Tests have completed running. Please see /tests directory for json results."