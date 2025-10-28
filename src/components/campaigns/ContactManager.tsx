// components/ContactManager.tsx
import { useState, useEffect, useCallback } from "react";
import { 
  X, Upload, Download, Plus, Trash2, Loader2, Search, 
  Edit, Save, Users, RefreshCw, ChevronLeft, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useContactStore, type ContactFilters, type Contact, type ContactList } from "@/store/useContactStore";
import { toast } from "sonner";

interface ContactManagerProps {
  contactListId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface NewContactForm {
  phoneNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  optedIn: boolean;
}

export function ContactManager({ contactListId, open, onOpenChange }: ContactManagerProps) {
  const {
    contacts,
    contactLists,
    loading,
    importing,
    pagination,
    fetchContacts,
    addContact,
    updateContact,
    deleteContact,
    importContactsFromFile,
    exportContacts,
    refreshContactLists,
    searchContacts
  } = useContactStore();

  const [activeTab, setActiveTab] = useState<"view" | "add" | "import">("view");
  const [filters, setFilters] = useState<ContactFilters>({});
  const [searchInput, setSearchInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editableContacts, setEditableContacts] = useState<(Contact & { isEditing: boolean; tempData: any })[]>([]);
  const [newContact, setNewContact] = useState<NewContactForm>({
    phoneNumber: '',
    firstName: '',
    lastName: '',
    email: '',
    optedIn: true,
  });

  const pageSize = 1000;
  const currentContactList = contactLists.find((list: ContactList) => list._id === contactListId);

  // Load contacts when dialog opens or contact list changes
  useEffect(() => {
    if (open && contactListId) {
      setCurrentPage(1);
      loadContacts(1);
      refreshContactLists();
    }
  }, [open, contactListId]);

  // Load contacts when filters or search change
  useEffect(() => {
    if (open && contactListId) {
      setCurrentPage(1);
      loadContacts(1);
    }
  }, [filters, searchInput]);

  // Update editable contacts when contacts change
  useEffect(() => {
    setEditableContacts(contacts.map(contact => ({
      ...contact,
      isEditing: false,
      tempData: null
    })));
  }, [contacts]);

  const loadContacts = useCallback(async (page: number = currentPage) => {
    try {
      await fetchContacts(contactListId, {
        ...filters,
        page,
        limit: pageSize,
        search: searchInput.trim() || undefined
      });
    } catch (error) {
      toast.error('Failed to load contacts');
    }
  }, [contactListId, filters, searchInput, fetchContacts, currentPage]);

  const handleSearch = (value: string) => {
    setSearchInput(value);
  };

  const handleFilterChange = (key: keyof ContactFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setFilters({});
    setCurrentPage(1);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ['.csv', 'application/vnd.ms-excel', 'text/csv'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (!validTypes.includes(`.${fileExtension}`) && !validTypes.includes(file.type)) {
      toast.error('Please upload a CSV file');
      return;
    }

    try {
      const result = await importContactsFromFile(contactListId, file);
      
      if (result.failed > 0) {
        toast.warning(`Imported ${result.success} contacts, ${result.failed} failed`, {
          description: result.errors.slice(0, 3).map(err => err.error).join(', ') + (result.errors.length > 3 ? '...' : '')
        });
      } else {
        toast.success(`Successfully imported ${result.success} contacts`);
      }
      
      // Switch to view tab and refresh contacts
      setActiveTab("view");
      await loadContacts(currentPage);
      await refreshContactLists();
      
      event.target.value = '';
    } catch (error: any) {
      toast.error(error.message || 'Failed to import contacts');
    }
  };

  const handleAddContact = async () => {
    if (!newContact.phoneNumber.trim()) {
      toast.error('Phone number is required');
      return;
    }

    try {
      await addContact(contactListId, {
        ...newContact,
        optedInCount: newContact.optedIn ? 1 : 0,
        opted_out_count: newContact.optedIn ? 0 : 1
      });
      
      setNewContact({
        phoneNumber: '',
        firstName: '',
        lastName: '',
        email: '',
        optedIn: true,
      });
      
      toast.success('Contact added successfully');
      
      // Refresh contacts and switch to view tab
      await loadContacts(currentPage);
      await refreshContactLists();
      setActiveTab("view");
    } catch (error: any) {
      toast.error(error.message || 'Failed to add contact');
    }
  };

  const handleEditContact = (contactId: string) => {
    setEditableContacts(prev => prev.map(contact => 
      contact._id === contactId 
        ? { 
            ...contact, 
            isEditing: true, 
            tempData: { 
              phoneNumber: contact.phoneNumber,
              firstName: contact.firstName,
              lastName: contact.lastName,
              email: contact.email,
              optedIn: contact.optedIn
            } 
          }
        : contact
    ));
  };

  const handleSaveContact = async (contactId: string) => {
    const contact = editableContacts.find(c => c._id === contactId);
    if (!contact?.tempData) return;

    try {
      await updateContact(contactId, contact.tempData);
      setEditableContacts(prev => prev.map(c => 
        c._id === contactId ? { ...c, isEditing: false, tempData: null } : c
      ));
      toast.success('Contact updated successfully');
      await loadContacts(currentPage);
      await refreshContactLists();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update contact');
    }
  };

  const handleCancelEdit = (contactId: string) => {
    setEditableContacts(prev => prev.map(contact => 
      contact._id === contactId 
        ? { ...contact, isEditing: false, tempData: null }
        : contact
    ));
  };

  const handleDeleteContact = async (contactId: string) => {
    try {
      await deleteContact(contactId);
      toast.success('Contact deleted successfully');
      await loadContacts(currentPage);
      await refreshContactLists();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete contact');
    }
  };

  const handleExportContacts = async () => {
    try {
      const csvContent = await exportContacts(contactListId, {
        ...filters,
        search: searchInput.trim() || undefined
      });
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `contacts-${currentContactList?.name}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Contacts exported successfully');
    } catch (error) {
      toast.error('Failed to export contacts');
    }
  };

  const downloadTemplate = () => {
    const csvContent = "phoneNumber,firstName,lastName,email,optedIn\n1234567890,John,Doe,john@example.com,true";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'contact_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleRefresh = async () => {
    await loadContacts(currentPage);
    await refreshContactLists();
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    loadContacts(newPage);
  };

  const renderPagination = () => {
    const totalPages = pagination.totalPages || 1;
    
    if (totalPages <= 1) return null;

    return (
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border rounded-lg shadow-lg px-4 py-2 z-10">
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground whitespace-nowrap">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1 || loading}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-1 mx-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
                    onClick={() => handlePageChange(pageNum)}
                    disabled={loading}
                    className="h-8 w-8 p-0 text-xs"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || loading}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-sm text-muted-foreground whitespace-nowrap">
            {pagination.total} total contacts
          </div>
        </div>
      </div>
    );
  };

  const hasActiveFilters = searchInput.trim() || Object.keys(filters).length > 0;
  const showingFilteredResults = hasActiveFilters && pagination.total !== currentContactList?.totalContacts;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {currentContactList?.name} - Contact Management
          </DialogTitle>
          <DialogDescription>
            {currentContactList?.totalContacts} total contacts • 
            {currentContactList?.optedInCount} opted in • 
            {currentContactList?.optedOutCount} opted out
            {showingFilteredResults && ` • Showing ${pagination.total} filtered contacts`}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "view" | "add" | "import")} className="flex flex-col flex-1 overflow-hidden">
          <TabsList className="flex-shrink-0 mx-6 grid w-[400px] grid-cols-3">
            <TabsTrigger value="view">View Contacts</TabsTrigger>
            <TabsTrigger value="add">Add Contact</TabsTrigger>
            <TabsTrigger value="import">Import</TabsTrigger>
          </TabsList>
          
          <div className="flex-1 flex flex-col overflow-hidden px-6 pb-20 pt-4">
            <TabsContent value="view" className="flex-1 flex flex-col overflow-hidden m-0 space-y-4 data-[state=active]:flex">
              {/* Filters and Search */}
              <Card className="flex-shrink-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex flex-wrap gap-3 items-center">
                    <div className="flex-1 min-w-[300px]">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by name, phone, or email..."
                          value={searchInput}
                          onChange={(e) => handleSearch(e.target.value)}
                          className="pl-10 h-10"
                        />
                      </div>
                    </div>
                    
                    <Select 
                      value={filters.optedIn?.toString() || ''} 
                      onValueChange={(value) => handleFilterChange('optedIn', value === '' ? undefined : value === 'true')}
                    >
                      <SelectTrigger className="w-[160px] h-10">
                        <SelectValue placeholder="Opt-in Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Opted In</SelectItem>
                        <SelectItem value="false">Opted Out</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="flex gap-2">
                      {hasActiveFilters && (
                        <Button variant="outline" size="default" onClick={clearAllFilters} className="h-10">
                          <X className="h-4 w-4 mr-2" />
                          Clear
                        </Button>
                      )}

                      <Button variant="outline" size="default" onClick={handleExportContacts} disabled={loading} className="h-10">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>

                      <Button size="default" onClick={handleRefresh} disabled={loading} className="h-10">
                        {loading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Refresh
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contacts Table */}
              <Card className="flex-1 flex flex-col overflow-hidden shadow-sm">
                <CardHeader className="flex-shrink-0 pb-3">
                  <CardTitle className="text-lg">
                    Contacts ({pagination.total || 0})
                    {showingFilteredResults && (
                      <span className="text-sm font-normal text-muted-foreground ml-2">
                        (filtered from {currentContactList?.totalContacts} total)
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
                  <div className="flex-1 overflow-auto">
                    <div className="border-t">
                      <Table>
                        <TableHeader className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 border-b">
                          <TableRow>
                            <TableHead className="font-semibold">Phone Number</TableHead>
                            <TableHead className="font-semibold">Name</TableHead>
                            <TableHead className="font-semibold">Email</TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                            <TableHead className="w-[140px] font-semibold">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {loading ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                <p className="text-sm text-muted-foreground mt-2">Loading contacts...</p>
                              </TableCell>
                            </TableRow>
                          ) : editableContacts.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-8">
                                <p className="text-muted-foreground">
                                  {hasActiveFilters 
                                    ? 'No contacts match your search criteria' 
                                    : 'No contacts found'
                                  }
                                </p>
                                {hasActiveFilters && (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="mt-2"
                                    onClick={clearAllFilters}
                                  >
                                    Clear filters
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ) : (
                            editableContacts.map((contact) => (
                              <TableRow key={contact._id}>
                                <TableCell className="font-mono">
                                  {contact.isEditing ? (
                                    <Input
                                      placeholder="Phone Number"
                                      value={contact.tempData?.phoneNumber || ''}
                                      onChange={(e) => setEditableContacts(prev => 
                                        prev.map(c => c._id === contact._id 
                                          ? { ...c, tempData: { ...c.tempData, phoneNumber: e.target.value } }
                                          : c
                                        )
                                      )}
                                    />
                                  ) : (
                                    `${contact.phoneNumber}`
                                  )}
                                </TableCell>
                                <TableCell>
                                  {contact.isEditing ? (
                                    <div className="flex gap-2">
                                      <Input
                                        placeholder="First name"
                                        value={contact.tempData?.firstName || ''}
                                        onChange={(e) => setEditableContacts(prev => 
                                          prev.map(c => c._id === contact._id 
                                            ? { ...c, tempData: { ...c.tempData, firstName: e.target.value } }
                                            : c
                                          )
                                        )}
                                      />
                                      <Input
                                        placeholder="Last name"
                                        value={contact.tempData?.lastName || ''}
                                        onChange={(e) => setEditableContacts(prev => 
                                          prev.map(c => c._id === contact._id 
                                            ? { ...c, tempData: { ...c.tempData, lastName: e.target.value } }
                                            : c
                                          )
                                        )}
                                      />
                                    </div>
                                  ) : (
                                    `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || '-'
                                  )}
                                </TableCell>
                                <TableCell>
                                  {contact.isEditing ? (
                                    <Input
                                      type="email"
                                      placeholder="Email"
                                      value={contact.tempData?.email || ''}
                                      onChange={(e) => setEditableContacts(prev => 
                                        prev.map(c => c._id === contact._id 
                                          ? { ...c, tempData: { ...c.tempData, email: e.target.value } }
                                          : c
                                        )
                                      )}
                                    />
                                  ) : (
                                    contact.email || '-'
                                  )}
                                </TableCell>
                                <TableCell>
                                  {contact.isEditing ? (
                                    <div className="flex items-center gap-2">
                                      <Switch
                                        checked={contact.tempData?.optedIn || false}
                                        onCheckedChange={(checked) => setEditableContacts(prev => 
                                          prev.map(c => c._id === contact._id 
                                            ? { ...c, tempData: { ...c.tempData, optedIn: checked } }
                                            : c
                                          )
                                        )}
                                      />
                                      <span className="text-sm">{contact.tempData?.optedIn ? 'Opted In' : 'Opted Out'}</span>
                                    </div>
                                  ) : (
                                    <Badge variant={contact.optedIn ? "default" : "secondary"}>
                                      {contact.optedIn ? 'Opted In' : 'Opted Out'}
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    {contact.isEditing ? (
                                      <>
                                        <Button 
                                          size="sm" 
                                          onClick={() => handleSaveContact(contact._id)}
                                          disabled={loading}
                                        >
                                          <Save className="h-3 w-3" />
                                        </Button>
                                        <Button 
                                          size="sm" 
                                          variant="outline" 
                                          onClick={() => handleCancelEdit(contact._id)}
                                          disabled={loading}
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      </>
                                    ) : (
                                      <>
                                        <Button 
                                          size="sm" 
                                          variant="outline" 
                                          onClick={() => handleEditContact(contact._id)}
                                          disabled={loading}
                                        >
                                          <Edit className="h-3 w-3" />
                                        </Button>
                                        <Button 
                                          size="sm" 
                                          variant="outline" 
                                          onClick={() => handleDeleteContact(contact._id)}
                                          disabled={loading}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Floating Pagination */}
              {renderPagination()}
            </TabsContent>

            <TabsContent value="add" className="m-0 data-[state=active]:block">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Add New Contact</CardTitle>
                  <CardDescription>Add a single contact to this list</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium">
                        Phone Number <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="phone"
                        placeholder="e.g., 1234567890"
                        value={newContact.phoneNumber}
                        onChange={(e) => setNewContact(prev => ({ ...prev, phoneNumber: e.target.value }))}
                        className="h-10"
                      />
                      {/* <p className="text-xs text-muted-foreground">Include country code if applicable</p> */}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        value={newContact.email}
                        onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
                      <Input
                        id="firstName"
                        placeholder="John"
                        value={newContact.firstName}
                        onChange={(e) => setNewContact(prev => ({ ...prev, firstName: e.target.value }))}
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        value={newContact.lastName}
                        onChange={(e) => setNewContact(prev => ({ ...prev, lastName: e.target.value }))}
                        className="h-10"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/50">
                    <Switch
                      id="optedIn"
                      checked={newContact.optedIn}
                      onCheckedChange={(checked) => setNewContact(prev => ({ ...prev, optedIn: checked }))}
                    />
                    <div className="flex-1">
                      <Label htmlFor="optedIn" className="text-sm font-medium cursor-pointer">
                        Opted In for Communications
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Contact has consented to receive messages
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button 
                      onClick={handleAddContact} 
                      disabled={!newContact.phoneNumber.trim() || loading}
                      size="lg"
                      className="min-w-[160px]"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4 mr-2" />
                      )}
                      Add Contact
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setNewContact({
                        phoneNumber: '',
                        firstName: '',
                        lastName: '',
                        email: '',
                        optedIn: true,
                      })}
                      size="lg"
                    >
                      Clear Form
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="import" className="m-0 data-[state=active]:block">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Import Contacts</CardTitle>
                  <CardDescription>Import multiple contacts from a CSV file</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-medium mb-2">Upload CSV File</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Drag and drop or click to select a CSV file
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Label htmlFor="file-upload" className="cursor-pointer">
                        <Button variant="default" size="lg" asChild disabled={importing}>
                          <div>
                            {importing ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4 mr-2" />
                            )}
                            {importing ? 'Importing...' : 'Choose File'}
                          </div>
                        </Button>
                        <Input
                          id="file-upload"
                          type="file"
                          accept=".csv"
                          className="hidden"
                          onChange={handleFileUpload}
                          disabled={importing}
                        />
                      </Label>
                      <Button variant="outline" size="lg" onClick={downloadTemplate}>
                        <Download className="h-4 w-4 mr-2" />
                        Download Template
                      </Button>
                    </div>
                  </div>
                  
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <h4 className="font-medium text-sm">CSV Format Requirements</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-xs text-muted-foreground mb-2">REQUIRED COLUMNS</p>
                        <ul className="space-y-1">
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-destructive rounded-full"></div>
                            <code className="text-xs">phoneNumber</code>
                            <span className="text-xs text-muted-foreground">(10-15 digits)</span>
                          </li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-medium text-xs text-muted-foreground mb-2">OPTIONAL COLUMNS</p>
                        <ul className="space-y-1">
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                            <code className="text-xs">firstName</code>
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                            <code className="text-xs">lastName</code>
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                            <code className="text-xs">email</code>
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                            <code className="text-xs">optedIn</code>
                            <span className="text-xs text-muted-foreground">(true/false)</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t">
                      <p className="font-medium text-xs text-muted-foreground mb-2">EXAMPLE CSV</p>
                      <pre className="text-xs bg-background p-3 rounded border overflow-x-auto">
{`phoneNumber,firstName,lastName,email,optedIn
+1234567890,John,Doe,john@example.com,true
+1987654320,Jane,Smith,jane@example.com,false
+1555666777,,,contact@example.com,true`}
                      </pre>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <div className="w-5 h-5 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">Import Tips</h4>
                        <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                          <li>• File must be in CSV format with header row</li>
                          <li>• Phone numbers should include country code</li>
                          <li>• Duplicate phone numbers will be skipped</li>
                          <li>• Large files may take a few minutes to process</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}