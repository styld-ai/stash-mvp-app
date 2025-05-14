import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader, ArrowUp, CircleCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { analyzeImages } from '@/lib/api';

interface AnalysisResult {
  imageId: string;
  originalSrc: string;
  heatmapSrc: string;
  attentionScore: number;
  colorImpact: number;
  readability: number;
  brandVisibility: number;
  overallScore: number;
  suggestions: string[];
  aiAnalysis?: string;
}

// Score card component for displaying individual scores
const ScoreCard = ({ label, score }: { label: string; score: number }) => (
  <div className="flex flex-col items-center bg-gray-50 rounded-lg p-3 text-center">
    <div className="text-sm text-gray-600 mb-1">{label}</div>
    <div className={`text-2xl font-bold ${score >= 8 ? 'text-green-600' : score >= 6 ? 'text-blue-600' : 'text-orange-500'}`}>
      {score.toFixed(1)}
    </div>
  </div>
);

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("original");
  
  // Get the uploaded images from the location state
  const uploadedImages = location.state?.uploadedImages || [];
  
  useEffect(() => {
    // If we have uploaded images from location state, analyze them
    if (uploadedImages.length) {
      const performAnalysis = async () => {
        try {
          setLoading(true);
          const analysisResults = await analyzeImages(uploadedImages);
          setResults(analysisResults);
          
          // Save results to localStorage
          localStorage.setItem('analysisResults', JSON.stringify(analysisResults));
          
          setLoading(false);
        } catch (error) {
          console.error("Error during analysis:", error);
          toast({
            title: "Analysis failed",
            description: "There was an error processing your images. Please try again.",
            variant: "destructive"
          });
          setLoading(false);
        }
      };
      
      performAnalysis();
      return;
    }
    
    // Otherwise check if we have saved results
    const savedResults = localStorage.getItem('analysisResults');
    if (savedResults) {
      try {
        const parsedResults = JSON.parse(savedResults);
        setResults(parsedResults);
        setLoading(false);
      } catch (error) {
        console.error("Error parsing saved results:", error);
        navigate('/');
      }
    } else {
      // No uploaded images and no saved results, go back to home
      navigate('/');
      toast({
        title: "No images to analyze",
        description: "Please upload images first",
        variant: "destructive"
      });
    }
  }, [uploadedImages, navigate]);
  
  const handleNewAnalysis = () => {
    navigate('/');
  };
  
  const handleDeployTest = () => {
    // Navigate to deploy test page
    navigate('/deploy');
  };
  
  const renderLoadingState = () => (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="mb-4">
        <Loader className="h-12 w-12 text-primary animate-spin" />
      </div>
      <h3 className="text-xl font-medium">Analyzing your packaging...</h3>
      <p className="text-gray-500 mt-2">This may take a minute. We're running our attention model to identify key areas.</p>
    </div>
  );
  
  const renderResults = () => (
    <div className="space-y-8">
      <Tabs defaultValue="original" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="original">Original Images</TabsTrigger>
          <TabsTrigger value="heatmap">Attention Heatmaps</TabsTrigger>
          <TabsTrigger value="ai">AI Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="original" className="space-y-6">
          {results.map((result) => (
            <Card key={result.imageId} className="overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CircleCheck className="mr-2 h-5 w-5 text-green-500" />
                  Packaging Analysis
                </CardTitle>
                <CardDescription>
                  Overall Score: <span className="font-bold text-lg">{result.overallScore.toFixed(1)}/10</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <img 
                    src={result.originalSrc} 
                    alt="Original packaging" 
                    className="w-full rounded-md object-contain max-h-80"
                  />
                </div>
                
                {/* Score metrics grid */}
                <div className="grid grid-cols-4 gap-3 my-4">
                  <ScoreCard label="Attention" score={result.attentionScore} />
                  <ScoreCard label="Color Impact" score={result.colorImpact} />
                  <ScoreCard label="Readability" score={result.readability} />
                  <ScoreCard label="Brand Visibility" score={result.brandVisibility} />
                </div>
                
                <div className="mt-4">
                  <h4 className="font-medium text-lg mb-2">Design Suggestions</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {result.suggestions.map((suggestion, index) => (
                      <li key={index} className="text-gray-700">{suggestion}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        
        <TabsContent value="heatmap" className="space-y-6">
          {results.map((result) => (
            <Card key={`heatmap-${result.imageId}`} className="overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CircleCheck className="mr-2 h-5 w-5 text-green-500" />
                  Attention Heatmap
                </CardTitle>
                <CardDescription>
                  Areas in red receive more attention, blue areas receive less
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <img 
                    src={result.heatmapSrc} 
                    alt="Attention heatmap" 
                    className="w-full rounded-md object-contain max-h-80"
                  />
                </div>
                <div className="mt-4 bg-gray-50 p-4 rounded-md">
                  <p className="text-sm text-gray-700">
                    This heatmap shows which areas of your packaging attract the most visual attention. 
                    Bright areas indicate high attention, while darker areas receive less focus.
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        
        <TabsContent value="ai" className="space-y-6">
          {results.map((result) => (
            <Card key={`ai-${result.imageId}`} className="overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CircleCheck className="mr-2 h-5 w-5 text-green-500" />
                  AI Design Analysis
                </CardTitle>
                <CardDescription>
                  Complete AI analysis of your packaging design
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <img 
                      src={result.originalSrc} 
                      alt="Original packaging" 
                      className="w-full rounded-md object-contain max-h-80"
                    />
                    
                    {/* Add score cards to AI tab as well */}
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <ScoreCard label="Overall" score={result.overallScore} />
                      <ScoreCard label="Attention" score={result.attentionScore} />
                      <ScoreCard label="Color Impact" score={result.colorImpact} />
                      <ScoreCard label="Readability" score={result.readability} />
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h4 className="font-medium text-lg mb-2">AI Analysis</h4>
                    {result.aiAnalysis ? (
                      <div className="text-sm whitespace-pre-wrap">
                        {result.aiAnalysis}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">
                        No AI analysis available.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
      
      {/* Create a single button container for all three buttons */}
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <Button 
            onClick={handleNewAnalysis} 
            className="flex items-center"
          >
            <ArrowUp className="mr-2 h-4 w-4" />
            Analyze New Images
          </Button>
          
          <Button variant="outline" onClick={handleNewAnalysis}>
            Analyze Different Images
          </Button>
        </div>
        
        <Button onClick={handleDeployTest} variant="default">
          Deploy Test
        </Button>
      </div>
    </div>
  );
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">Stash Packaging-Attention MVP</h1>
        </div>
      </header>
      
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Card>
            <CardHeader>
              <CardTitle>Analysis Results</CardTitle>
              <CardDescription>
                Review how your packaging performs on visual attention metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? renderLoadingState() : renderResults()}
            </CardContent>
            {/* Remove buttons from CardFooter since they're now in the renderResults */}
            <CardFooter>
              {/* Footer is empty now, buttons moved to main content area */}
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Results;