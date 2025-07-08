'use client';

import { useState } from 'react';
import HandoffSettings from '@/components/models/HandoffSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function TestHandoffPage() {
  const [handoffEnabled, setHandoffEnabled] = useState(true);
  const [handoffSettings, setHandoffSettings] = useState({
    triggerOnKeywords: ['human', 'agent', 'help'],
    triggerOnAutoDetect: true,
    autoDetectSensitivity: 'medium',
    triggerOnSentiment: false,
    sentimentThreshold: -0.5,
    triggerOnComplexity: false,
    maxConversationLength: 10,
    handoffMethod: 'internal_notification',
    handoffMessage: "I'm connecting you with a human agent who can better assist you.",
    customerWaitMessage: "Please wait while I connect you with a human agent.",
    offlineMessage: "Our support team is currently offline. Please leave your message and we'll get back to you.",
  });

  const [testMessage, setTestMessage] = useState('');
  const [testResults, setTestResults] = useState<any>(null);

  const handleHandoffUpdate = (enabled: boolean, settings: any) => {
    setHandoffEnabled(enabled);
    setHandoffSettings(settings);
  };

  const testDetection = async () => {
    if (!testMessage) return;

    // Simulate detection logic client-side since we removed the test endpoint
    const messageWords = testMessage.toLowerCase().split(/\s+/);
    const foundKeywords = handoffSettings.triggerOnKeywords.filter(keyword => 
      messageWords.some(word => word.includes(keyword.toLowerCase()))
    );

    // Simple sentiment detection
    const negativeWords = ['frustrated', 'angry', 'upset', 'annoyed', 'terrible', 'awful', 'horrible', 'hate', 'worst'];
    const hasNegativeSentiment = negativeWords.some(word => testMessage.toLowerCase().includes(word));

    // Simple AI-like detection patterns
    const humanRequestPatterns = [
      /\b(human|person|agent|representative|operator)\b/i,
      /\b(talk to|speak with|connect me|transfer me)\b/i,
      /\b(frustrated|help me|assistance|support)\b/i,
      /\b(manager|supervisor|escalate)\b/i,
      /\b(urgent|important|asap|emergency)\b/i
    ];

    const aiDetectionMatch = humanRequestPatterns.some(pattern => pattern.test(testMessage));
    const aiConfidence = aiDetectionMatch ? (foundKeywords.length > 0 ? 0.9 : 0.7) : 0.3;

    // Simulate test results
    const simulatedResults = {
      success: true,
      detection: {
        message: testMessage,
        keywordMatches: foundKeywords,
        keywordTriggered: foundKeywords.length > 0,
        autoDetectEnabled: handoffSettings.triggerOnAutoDetect,
        autoDetectTriggered: handoffSettings.triggerOnAutoDetect && aiDetectionMatch,
        aiConfidence: aiConfidence,
        sentimentTriggered: handoffSettings.triggerOnSentiment && hasNegativeSentiment,
        wouldTriggerHandoff: foundKeywords.length > 0 || 
                           (handoffSettings.triggerOnAutoDetect && aiDetectionMatch) ||
                           (handoffSettings.triggerOnSentiment && hasNegativeSentiment),
        triggerReasons: [
          ...(foundKeywords.length > 0 ? [`Keywords: ${foundKeywords.join(', ')}`] : []),
          ...(handoffSettings.triggerOnAutoDetect && aiDetectionMatch ? [`AI Detection (${Math.round(aiConfidence * 100)}% confidence)`] : []),
          ...(handoffSettings.triggerOnSentiment && hasNegativeSentiment ? ['Negative sentiment detected'] : [])
        ]
      },
      settings: {
        handoffEnabled: handoffEnabled,
        keywordsConfigured: handoffSettings.triggerOnKeywords,
        autoDetectEnabled: handoffSettings.triggerOnAutoDetect,
        autoDetectSensitivity: handoffSettings.autoDetectSensitivity,
        sentimentDetectionEnabled: handoffSettings.triggerOnSentiment
      }
    };

    setTestResults(simulatedResults);
  };

  // Simple keyword detection for demo
  const detectKeywords = () => {
    if (!testMessage) return [];
    const messageWords = testMessage.toLowerCase().split(/\s+/);
    return handoffSettings.triggerOnKeywords.filter(keyword => 
      messageWords.some(word => word.includes(keyword.toLowerCase()))
    );
  };

  const detectedKeywords = detectKeywords();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Live Chat & Human Handoff Test</h1>
          <p className="text-gray-600 mt-2">Test the handoff settings and auto-detection functionality</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Handoff Settings */}
          <div>
            <HandoffSettings 
              assistantId="demo-assistant"
              enabled={handoffEnabled}
              settings={handoffSettings}
              onUpdate={handleHandoffUpdate}
            />
          </div>

          {/* Test Interface */}
          <div className="space-y-6">
                    <Card>
          <CardHeader>
            <CardTitle>Test Detection</CardTitle>
                <CardDescription>
                  Try different messages to see how the handoff system responds
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Test Message</Label>
                  <Input
                    placeholder="Type a message to test..."
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                  />
                </div>
                
                <Button onClick={testDetection} disabled={!testMessage}>
                  Test Detection
                </Button>

                {testMessage && (
                  <div className="border rounded p-4 bg-blue-50">
                    <h4 className="font-medium text-blue-800 mb-2">Current Detection</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <strong>Message:</strong> "{testMessage}"
                      </div>
                      <div>
                        <strong>Keyword Matches:</strong> {detectedKeywords.length > 0 ? detectedKeywords.join(', ') : 'None'}
                      </div>
                                              <div>
                          <strong>Auto-Detect Enabled:</strong> {handoffSettings.triggerOnAutoDetect ? 'Yes' : 'No'}
                        </div>
                      <div>
                        <strong>Would Trigger Handoff:</strong> {
                          detectedKeywords.length > 0 || handoffSettings.triggerOnAutoDetect ? 
                          'Yes' : 'No'
                        }
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Example Messages */}
            <Card>
              <CardHeader>
                <CardTitle>Example Test Messages</CardTitle>
                <CardDescription>Try these messages to test different scenarios</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    "I want to talk to a human",
                    "Can I speak with an agent?",
                    "This isn't working, I need help",
                    "I'm frustrated and need to talk to someone",
                    "Transfer me to a representative",
                    "What are your business hours?",
                    "How do I cancel my subscription?",
                    "I need urgent assistance",
                    "Can you escalate this to a manager?",
                    "This is terrible customer service"
                  ].map((example, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => setTestMessage(example)}
                      className="mr-2 mb-2"
                    >
                      "{example}"
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Test Results */}
            {testResults && (
              <Card>
                <CardHeader>
                  <CardTitle>Test Results</CardTitle>
                </CardHeader>
                <CardContent>
                  {testResults.success ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded">
                          <div className="font-medium text-gray-800">Detection Summary</div>
                          <div className="text-sm space-y-1 mt-2">
                            <div>Keywords: {testResults.detection.keywordTriggered ? 'Triggered' : 'No match'}</div>
                            <div>AI Auto-detect: {testResults.detection.autoDetectTriggered ? 'Triggered' : 'No match'}</div>
                            <div>Sentiment: {testResults.detection.sentimentTriggered ? 'Triggered' : 'No match'}</div>
                          </div>
                        </div>
                        
                        <div className={`p-3 rounded ${testResults.detection.wouldTriggerHandoff ? 'bg-green-50' : 'bg-yellow-50'}`}>
                          <div className="font-medium text-gray-800">Final Result</div>
                          <div className={`text-lg font-bold mt-1 ${testResults.detection.wouldTriggerHandoff ? 'text-green-600' : 'text-yellow-600'}`}>
                            {testResults.detection.wouldTriggerHandoff ? 'HANDOFF TRIGGERED' : 'No Handoff'}
                          </div>
                          {testResults.detection.triggerReasons.length > 0 && (
                            <div className="text-xs mt-2">
                              <strong>Reasons:</strong>
                              <ul className="list-disc list-inside">
                                                                 {testResults.detection.triggerReasons.map((reason: string, i: number) => (
                                   <li key={i}>{reason}</li>
                                 ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <details className="border rounded p-3">
                        <summary className="cursor-pointer font-medium">Raw Detection Data</summary>
                        <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto mt-2">
                          {JSON.stringify(testResults, null, 2)}
                        </pre>
                      </details>
                    </div>
                  ) : (
                    <div className="text-red-600">
                      Error: {testResults.error || 'Unknown error'}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Status Summary */}
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded">
                <div className="text-2xl mb-2"></div>
                <div className="font-medium">Handoff Settings</div>
                                  <div className="text-sm text-gray-600">
                    {handoffEnabled ? 'Enabled' : 'Disabled'}
                  </div>
              </div>
              
                              <div className="text-center p-4 bg-blue-50 rounded">
                  <div className="text-2xl mb-2"></div>
                  <div className="font-medium">AI Auto-Detect</div>
                  <div className="text-sm text-gray-600">
                    {handoffSettings.triggerOnAutoDetect ? 'Active' : 'Inactive'}
                  </div>
                </div>
              
                              <div className="text-center p-4 bg-purple-50 rounded">
                  <div className="text-2xl mb-2"></div>
                <div className="font-medium">Keywords</div>
                <div className="text-sm text-gray-600">
                  {handoffSettings.triggerOnKeywords.length} configured
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 