import { Result } from "@shared/schema";

interface RecentResultsProps {
  results: Result[];
  isLoading: boolean;
}

export default function RecentResults({ results, isLoading }: RecentResultsProps) {
  if (isLoading) {
    return (
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-foreground flex items-center">
            <i className="fas fa-chart-line text-primary mr-3"></i>
            Recent Extractions
          </h2>
        </div>
        <div className="glass-card rounded-2xl p-6 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" />
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-foreground flex items-center">
          <i className="fas fa-chart-line text-primary mr-3"></i>
          Recent Extractions
        </h2>
        <button className="glass-card px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="button-view-all-results">
          <i className="fas fa-eye mr-2"></i>View All
        </button>
      </div>

      {results.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center mb-4 opacity-50">
            <i className="fas fa-search text-white text-2xl"></i>
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">No Extractions Yet</h3>
          <p className="text-muted-foreground mb-4">Upload a CSV file to start extracting Instagram handles from websites!</p>
          <button className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-6 py-3 rounded-xl font-medium hover:scale-105 transition-transform" data-testid="button-upload-first-csv">
            <i className="fas fa-upload mr-2"></i>Upload CSV
          </button>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Domain</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">IG Handle</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Confidence</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {results.map((result) => (
                  <tr key={result.id} className="hover:bg-white/5 transition-colors" data-testid={`result-row-${result.id}`}>
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                          <i className="fas fa-globe text-white text-xs"></i>
                        </div>
                        <span className="font-medium text-foreground" data-testid={`result-domain-${result.id}`}>
                          {result.domain}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      {result.igHandle ? (
                        <a 
                          href={`https://instagram.com/${result.igHandle.replace('@', '')}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80 font-medium"
                          data-testid={`result-handle-${result.id}`}
                        >
                          {result.igHandle}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">Not found</span>
                      )}
                    </td>
                    <td className="p-4">
                      {result.confidence && parseFloat(result.confidence) > 0 ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-12 bg-muted rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                parseFloat(result.confidence) >= 80 
                                  ? 'bg-green-500' 
                                  : parseFloat(result.confidence) >= 60 
                                  ? 'bg-yellow-500' 
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(parseFloat(result.confidence), 100)}%` }}
                            ></div>
                          </div>
                          <span className={`text-sm font-medium ${
                            parseFloat(result.confidence) >= 80 
                              ? 'text-green-400' 
                              : parseFloat(result.confidence) >= 60 
                              ? 'text-yellow-400' 
                              : 'text-red-400'
                          }`} data-testid={`result-confidence-${result.id}`}>
                            {parseFloat(result.confidence).toFixed(0)}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        result.status === 'found' 
                          ? 'bg-green-500/20 text-green-400' 
                          : result.status === 'not_found'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                      }`} data-testid={`result-status-${result.id}`}>
                        {result.status === 'found' ? 'Verified' : result.status === 'not_found' ? 'Not Found' : 'Error'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        {result.sourceUrl && (
                          <a 
                            href={result.sourceUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80"
                            data-testid={`result-source-${result.id}`}
                          >
                            <i className="fas fa-external-link-alt"></i>
                          </a>
                        )}
                        {result.igHandle && (
                          <button className="text-muted-foreground hover:text-foreground" data-testid={`result-add-${result.id}`}>
                            <i className="fas fa-plus"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
