#!/bin/bash -l

# Log the date and time
echo "---- Cron Job Run at $(date) ----" >> /home/confusedsammie/cron_debug.log

# Set the PATH variable to include directories where 'node' is located
export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"

# If using nvm (Node Version Manager), initialize it
export NVM_DIR="$HOME/.nvm"
# Load nvm if it's installed
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Move to the script's directory
DIR_PATH=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
cd "$DIR_PATH/.."

# Log the current working directory (optional)
echo "Current working directory: $(pwd)" >> /home/confusedsammie/cron_debug.log

# Run your Node.js script
node --loader ts-node/esm --no-warnings cron/fetchStats.ts 2>&1 | tee cron/logs/log.txt

# Log the completion of the script
echo "---- End of Run ----" >> /home/confusedsammie/cron_debug.log
