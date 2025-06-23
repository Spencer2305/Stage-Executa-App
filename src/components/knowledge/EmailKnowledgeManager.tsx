"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Search, Filter, Trash2, Eye, Calendar, User, Tag, FileText, CheckCircle, X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface EmailFile {
  id: string;
  originalName: string;
  emailFrom: string;
  emailTo: string[];
  emailSubject: string;
  emailDate: Date;
  emailLabels: string[];
  extractedText: string;
  textLength: number;
  fileSize: number;
  status: string;
  createdAt: Date;
}

interface EmailKnowledgeManagerProps {
  assistantId: string;
}

export default function EmailKnowledgeManager({ assistantId }: EmailKnowledgeManagerProps) {
  const [emails, setEmails] = useState<EmailFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [filterSender, setFilterSender] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [showEmailContent, setShowEmailContent] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  useEffect(() => {
    loadEmails();
    
    // Auto-refresh every 30 seconds to catch new synced emails
    const interval = setInterval(() => {
      loadEmails();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [assistantId]);

  const loadEmails = async () => {
    try {
      const token = localStorage.getItem('executa-auth-token');
      const response = await fetch(`/api/assistants/${assistantId}/emails`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEmails(data.emails || []);
      } else {
        toast.error('Failed to load emails');
      }
    } catch (error) {
      console.error('Failed to load emails:', error);
      toast.error('Failed to load emails');
    } finally {
      setLoading(false);
    }
  };

  const deleteSelectedEmails = async () => {
    if (selectedEmails.size === 0) {
      toast.error('No emails selected');
      return;
    }

    setDeleting(true);
    try {
      const token = localStorage.getItem('executa-auth-token');
      const response = await fetch(`/api/assistants/${assistantId}/emails/delete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailIds: Array.from(selectedEmails)
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Deleted ${data.deletedCount} emails from knowledge base`);
        setSelectedEmails(new Set());
        loadEmails(); // Reload the list
      } else {
        throw new Error('Failed to delete emails');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete emails');
    } finally {
      setDeleting(false);
    }
  };

  const toggleEmailSelection = (emailId: string) => {
    const newSelected = new Set(selectedEmails);
    if (newSelected.has(emailId)) {
      newSelected.delete(emailId);
    } else {
      newSelected.add(emailId);
    }
    setSelectedEmails(newSelected);
  };

  const selectAllEmails = () => {
    const allEmailIds = filteredAndSortedEmails.map(email => email.id);
    setSelectedEmails(new Set(allEmailIds));
  };

  const clearSelection = () => {
    setSelectedEmails(new Set());
  };

  // Filter and sort emails
  const filteredAndSortedEmails = emails
    .filter(email => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          email.emailSubject?.toLowerCase().includes(searchLower) ||
          email.emailFrom?.toLowerCase().includes(searchLower) ||
          email.extractedText?.toLowerCase().includes(searchLower)
        );
      }
      return true;
    })
    .filter(email => {
      // Sender filter
      if (filterSender !== 'all') {
        return email.emailFrom === filterSender;
      }
      return true;
    })
    .filter(email => {
      // Date range filter
      if (filterDateRange !== 'all') {
        const emailDate = new Date(email.emailDate);
        const now = new Date();
        
        switch (filterDateRange) {
          case 'today':
            return emailDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return emailDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return emailDate >= monthAgo;
          default:
            return true;
        }
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.emailDate).getTime() - new Date(a.emailDate).getTime();
        case 'date-asc':
          return new Date(a.emailDate).getTime() - new Date(b.emailDate).getTime();
        case 'subject':
          return a.emailSubject?.localeCompare(b.emailSubject || '') || 0;
        case 'sender':
          return a.emailFrom?.localeCompare(b.emailFrom || '') || 0;
        case 'size':
          return b.textLength - a.textLength;
        default:
          return 0;
      }
    });

  // Get unique senders for filter dropdown
  const uniqueSenders = [...new Set(emails.map(email => email.emailFrom).filter(Boolean))];

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedEmails.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEmails = filteredAndSortedEmails.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterSender, filterDateRange, sortBy]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2">Loading emails...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-lg font-medium">Gmail Emails</h3>
          <Badge variant="secondary">{emails.length} {emails.length === 1 ? 'email' : 'emails'}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          View, filter, and manage emails in your assistant's knowledge base. Remove emails that aren't relevant to improve your assistant's responses.
        </p>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col space-y-3 lg:flex-row lg:space-y-0 lg:space-x-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search emails by subject, sender, or content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterSender} onValueChange={setFilterSender}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Filter by sender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All senders</SelectItem>
                {uniqueSenders.map(sender => (
                  <SelectItem key={sender} value={sender}>
                    {sender}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filterDateRange} onValueChange={setFilterDateRange}>
              <SelectTrigger className="w-full lg:w-32">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last week</SelectItem>
                <SelectItem value="month">Last month</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full lg:w-32">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Newest first</SelectItem>
                <SelectItem value="date-asc">Oldest first</SelectItem>
                <SelectItem value="subject">Subject A-Z</SelectItem>
                <SelectItem value="sender">Sender A-Z</SelectItem>
                <SelectItem value="size">Content length</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {filteredAndSortedEmails.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllEmails}
                  disabled={selectedEmails.size === filteredAndSortedEmails.length}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Select All ({filteredAndSortedEmails.length})
                </Button>
                
                {selectedEmails.size > 0 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearSelection}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear ({selectedEmails.size})
                    </Button>
                    
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={deleteSelectedEmails}
                      disabled={deleting}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      {deleting ? 'Deleting...' : `Delete ${selectedEmails.size} ${selectedEmails.size === 1 ? 'email' : 'emails'}`}
                    </Button>
                  </>
                )}
              </div>
              
              <div className="text-sm text-gray-600">
                Showing {filteredAndSortedEmails.length} of {emails.length} {emails.length === 1 ? 'email' : 'emails'}
              </div>
            </div>
          )}

          {/* Pagination Info */}
          {filteredAndSortedEmails.length > 0 && (
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>
                Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredAndSortedEmails.length)} of {filteredAndSortedEmails.length} {filteredAndSortedEmails.length === 1 ? 'email' : 'emails'}
              </span>
              <span>Page {currentPage} of {totalPages}</span>
            </div>
          )}

          {/* Email List */}
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-2">
            {paginatedEmails.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {emails.length === 0 ? (
                  <div>
                    <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No emails found in knowledge base</p>
                    <p className="text-sm">Sync your Gmail to add emails to your assistant's knowledge</p>
                  </div>
                ) : (
                  <div>
                    <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No emails match your filters</p>
                    <p className="text-sm">Try adjusting your search or filter criteria</p>
                  </div>
                )}
              </div>
            ) : (
              paginatedEmails.map((email) => (
                <div
                  key={email.id}
                  className={`border rounded-lg p-4 hover:bg-gray-50 transition-colors ${
                    selectedEmails.has(email.id) ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      checked={selectedEmails.has(email.id)}
                      onCheckedChange={() => toggleEmailSelection(email.id)}
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">
                            {email.emailSubject || 'No Subject'}
                          </h3>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                            <span className="flex items-center">
                              <User className="h-3 w-3 mr-1" />
                              {email.emailFrom}
                            </span>
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(email.emailDate).toLocaleDateString()}
                            </span>
                            <span className="flex items-center">
                              <FileText className="h-3 w-3 mr-1" />
                              {email.textLength.toLocaleString()} chars
                            </span>
                          </div>
                          
                          {email.emailLabels && email.emailLabels.length > 0 && (
                            <div className="flex items-center space-x-1 mt-2">
                              <Tag className="h-3 w-3 text-gray-400" />
                              {email.emailLabels.slice(0, 3).map((label, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {label}
                                </Badge>
                              ))}
                              {email.emailLabels.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{email.emailLabels.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowEmailContent(email.id)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
                              <DialogHeader>
                                <DialogTitle>{email.emailSubject || 'No Subject'}</DialogTitle>
                                <DialogDescription>
                                  From {email.emailFrom} • {new Date(email.emailDate).toLocaleString()}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="overflow-y-auto">
                                <Textarea
                                  value={email.extractedText}
                                  readOnly
                                  className="min-h-[400px] font-mono text-sm"
                                />
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedEmails(new Set([email.id]));
                              deleteSelectedEmails();
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Email preview */}
                      <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                        {email.extractedText?.substring(0, 200)}...
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
            </div>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              
              <div className="flex space-x-1">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
    </div>
  );
} 