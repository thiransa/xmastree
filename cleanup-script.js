// ONE-TIME CLEANUP SCRIPT
// Run this once in the browser console on the decorator.html page to clean up old designs
// This will keep only the 3 most recent designs and delete all others

async function cleanupOldDesigns() {
    console.log('Starting one-time cleanup...');
    
    try {
        // Fetch all designs ordered by creation date (newest first)
        const { data: allDesigns, error: fetchError } = await supabase
            .from('decorated_trees')
            .select('id, created_at, nickname')
            .order('created_at', { ascending: false });
        
        if (fetchError) {
            console.error('Error fetching designs:', fetchError);
            return;
        }
        
        console.log(`Total designs found: ${allDesigns.length}`);
        
        if (allDesigns.length <= 3) {
            console.log('3 or fewer designs exist. No cleanup needed.');
            return;
        }
        
        // Keep the 3 most recent, delete the rest
        const designsToKeep = allDesigns.slice(0, 3);
        const designsToDelete = allDesigns.slice(3);
        const idsToDelete = designsToDelete.map(d => d.id);
        
        console.log(`Keeping ${designsToKeep.length} designs:`, designsToKeep.map(d => d.nickname));
        console.log(`Deleting ${designsToDelete.length} old designs:`, designsToDelete.map(d => d.nickname));
        
        // Delete old designs from database
        const { error: deleteError } = await supabase
            .from('decorated_trees')
            .delete()
            .in('id', idsToDelete);
        
        if (deleteError) {
            console.error('Error deleting old designs:', deleteError);
        } else {
            console.log('✅ Successfully deleted old designs!');
            console.log('Remaining designs in database: 3');
            console.log('Refresh the page to see the updated gallery.');
        }
    } catch (error) {
        console.error('Cleanup failed:', error);
    }
}

// Run the cleanup
cleanupOldDesigns();
