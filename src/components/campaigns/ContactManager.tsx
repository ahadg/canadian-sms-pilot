// components/ContactManager.tsx
import { useState, useEffect, useCallback } from "react";
import { 
  X, Upload, Download, Plus, Trash2, Loader2, Search, 
  Edit, Save, Users, RefreshCw
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
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [editableContacts, setEditableContacts] = useState<(Contact & { isEditing: boolean; tempData: any })[]>([]);
  const [newContact, setNewContact] = useState<NewContactForm>({
    phoneNumber: '',
    firstName: '',
    lastName: '',
    email: '',
    optedIn: true,
  });

  const currentContactList = contactLists.find((list: ContactList) => list._id === contactListId);

  // Load contacts when dialog opens or contact list changes
  useEffect(() => {
    if (open && contactListId) {
      loadContacts();
      refreshContactLists(); // Refresh lists to get latest counts
    }
  }, [open, contactListId]); // Removed loadContacts from dependencies

  // Update filtered contacts when contacts, search, or filters change
  useEffect(() => {
    if (searchInput.trim() || Object.keys(filters).length > 0) {
      const results = searchContacts(searchInput, filters);
      setFilteredContacts(results);
    } else {
      setFilteredContacts(contacts);
    }
  }, [contacts, searchInput, filters, searchContacts]);

  // Update editable contacts when filtered contacts change
  useEffect(() => {
    setEditableContacts(filteredContacts.map(contact => ({
      ...contact,
      isEditing: false,
      tempData: null
    })));
  }, [filteredContacts]);

  const loadContacts = useCallback(async () => {
    try {
      await fetchContacts(contactListId, filters);
    } catch (error) {
      toast.error('Failed to load contacts');
    }
  }, [contactListId, filters, fetchContacts]);

  const handleSearch = (value: string) => {
    setSearchInput(value);
  };

  const handleFilterChange = (key: keyof ContactFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setFilters({});
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
      await loadContacts();
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
      await loadContacts();
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
      await loadContacts();
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
      //await loadContacts();
      //await refreshContactLists();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete contact');
    }
  };

  const handleExportContacts = async () => {
    try {
      const csvContent = await exportContacts(contactListId, filters);
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
    const csvContent = "phoneNumber,firstName,lastName,email,optedIn\n+1234567890,John,Doe,john@example.com,true";
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
    await loadContacts();
    await refreshContactLists();
  };

  const hasActiveFilters = searchInput.trim() || Object.keys(filters).length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {currentContactList?.name} - Contact Management
          </DialogTitle>
          <DialogDescription>
            {currentContactList?.totalContacts} total contacts • 
            {currentContactList?.optedInCount} opted in • 
            {currentContactList?.optedOutCount} opted out
            {hasActiveFilters && ` • Showing ${filteredContacts.length} filtered contacts`}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "view" | "add" | "import")} className="flex flex-col flex-1 overflow-hidden">
          <TabsList className="flex-shrink-0">
            <TabsTrigger value="view">View Contacts</TabsTrigger>
            <TabsTrigger value="add">Add Contact</TabsTrigger>
            <TabsTrigger value="import">Import</TabsTrigger>
          </TabsList>
          <div className="flex-1 overflow-y-auto pr-2 mt-4">
          <TabsContent value="view" className="space-y-4 pb-8 m-0">
            {/* Filters and Search */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex-1 min-w-[300px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search contacts..."
                        value={searchInput}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <Select 
                    value={filters.optedIn?.toString() || ''} 
                    onValueChange={(value) => handleFilterChange('optedIn', value === '' ? undefined : value === 'true')}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Opt-in Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Opted In</SelectItem>
                      <SelectItem value="false">Opted Out</SelectItem>
                    </SelectContent>
                  </Select>

                  {hasActiveFilters && (
                    <Button variant="outline" onClick={clearAllFilters}>
                      <X className="h-4 w-4 mr-2" />
                      Clear Filters
                    </Button>
                  )}

                  <Button variant="outline" onClick={handleExportContacts} disabled={loading}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>

                  <Button onClick={handleRefresh} disabled={loading}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Contacts Table */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Contacts ({filteredContacts.length})
                  {hasActiveFilters && (
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      (filtered from {contacts.length} total)
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Phone Number</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[120px]">Actions</TableHead>
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="add" className="space-y-4 pb-8 m-0">
            <Card>
              <CardHeader>
                <CardTitle>Add New Contact</CardTitle>
                <CardDescription>Add a single contact to this list</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      placeholder="1234567890"
                      value={newContact.phoneNumber}
                      onChange={(e) => setNewContact(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      value={newContact.firstName}
                      onChange={(e) => setNewContact(prev => ({ ...prev, firstName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      value={newContact.lastName}
                      onChange={(e) => setNewContact(prev => ({ ...prev, lastName: e.target.value }))}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={newContact.email}
                      onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={newContact.optedIn}
                      onCheckedChange={(checked) => setNewContact(prev => ({ ...prev, optedIn: checked }))}
                    />
                    <Label htmlFor="optedIn">Opted In</Label>
                  </div>
                </div>
                <Button 
                  onClick={handleAddContact} 
                  className="mt-4"
                  disabled={!newContact.phoneNumber.trim() || loading}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Contact
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="import" className="space-y-4 pb-8 m-0">
            <Card>
              <CardHeader>
                <CardTitle>Import Contacts</CardTitle>
                <CardDescription>Import multiple contacts from a CSV file</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload a CSV file with contact information
                  </p>
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <Button variant="outline" asChild disabled={importing}>
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
                  <Button variant="outline" onClick={downloadTemplate} className="ml-2">
                    <Download className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>
                </div>
                
                <div className="text-sm text-muted-foreground space-y-1">
                  <p><strong>Required column:</strong> phoneNumber</p>
                  <p><strong>Optional columns:</strong> firstName, lastName, email, optedIn</p>
                  <p><strong>Format:</strong> CSV with header row</p>
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