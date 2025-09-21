// components/ContactManager.tsx
import { useState } from "react";
import { X, Upload, Download, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCampaigns, type Contact } from "@/hooks/useCampaigns";
import { toast } from "sonner";

interface ContactManagerProps {
  contactListId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContactManager({ contactListId, open, onOpenChange }: ContactManagerProps) {
  const { fetchContacts, addContacts, importContactsFromFile } = useCampaigns();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [newContact, setNewContact] = useState({
    phone_number: '',
    first_name: '',
    last_name: '',
    opted_in: true
  });

  const loadContacts = async () => {
    if (!contactListId) return;
    
    setLoading(true);
    try {
      const contactsData = await fetchContacts(contactListId);
      setContacts(contactsData);
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      await importContactsFromFile(contactListId, file);
      await loadContacts();
      toast.success('Contacts imported successfully');
    } catch (error: any) {
      console.error('Error importing contacts:', error);
      toast.error(error.message || 'Failed to import contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async () => {
    if (!newContact.phone_number) {
      toast.error('Phone number is required');
      return;
    }

    try {
      await addContacts(contactListId, [{
        ...newContact,
        contact_list_id: contactListId
      }]);
      setNewContact({
        phone_number: '',
        first_name: '',
        last_name: '',
        opted_in: true
      });
      await loadContacts();
      toast.success('Contact added successfully');
    } catch (error) {
      console.error('Error adding contact:', error);
      toast.error('Failed to add contact');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Contacts</DialogTitle>
          <DialogDescription>
            Add, edit, or import contacts for this list
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Import Section */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-3">Import Contacts</h3>
            <div className="flex items-center gap-2">
              <Label htmlFor="file-upload" className="cursor-pointer">
                <Button variant="outline" asChild>
                  <div>
                    <Upload className="h-4 w-4 mr-2" />
                    Import CSV/Excel
                  </div>
                </Button>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </Label>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </div>
          </div>

          {/* Add Contact Form */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-3">Add Contact Manually</h3>
            <div className="grid grid-cols-4 gap-2">
              <Input
                placeholder="Phone Number"
                value={newContact.phone_number}
                onChange={(e) => setNewContact(prev => ({ ...prev, phone_number: e.target.value }))}
              />
              <Input
                placeholder="First Name"
                value={newContact.first_name}
                onChange={(e) => setNewContact(prev => ({ ...prev, first_name: e.target.value }))}
              />
              <Input
                placeholder="Last Name"
                value={newContact.last_name}
                onChange={(e) => setNewContact(prev => ({ ...prev, last_name: e.target.value }))}
              />
              <Button onClick={handleAddContact}>
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            </div>
          </div>

          {/* Contacts Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>First Name</TableHead>
                  <TableHead>Last Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell>{contact.phone_number}</TableCell>
                    <TableCell>{contact.first_name || '-'}</TableCell>
                    <TableCell>{contact.last_name || '-'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        contact.opted_in 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {contact.opted_in ? 'Opted In' : 'Opted Out'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}