import * as yup from 'yup';

// Auth validation schemas
export const loginSchema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

export const signupSchema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
  role: yup.string().required('Role is required'),
});

// Project validation schema
export const projectSchema = yup.object({
  name: yup.string().required('Project name is required'),
  description: yup.string().required('Description is required'),
  startDate: yup.string().required('Start date is required'),
  endDate: yup.string().required('End date is required'),
  status: yup.string().oneOf(['Planning', 'In Progress', 'Completed', 'On Hold']).required('Status is required'),
  budget: yup.number().positive('Budget must be positive').required('Budget is required'),
  projectArea: yup.number().positive('Project area must be positive').required('Project area is required'),
  areaUnit: yup.string().oneOf(['sq_mtr', 'sq_ft', 'sq_yd', 'acres', 'hectares']).required('Area unit is required'),
  sitePossessionStartDate: yup.string().required('Site possession start date is required'),
  sitePossessionEndDate: yup.string().required('Site possession end date is required'),
});

// Inventory validation schema
export const inventorySchema = yup.object({
  name: yup.string().required('Item name is required'),
  description: yup.string().required('Description is required'),
  category: yup.string().required('Category is required'),
  quantity: yup.number().min(0, 'Quantity cannot be negative').required('Quantity is required'),
  unitPrice: yup.number().positive('Unit price must be positive').required('Unit price is required'),
  reorderLevel: yup.number().min(0, 'Reorder level cannot be negative').required('Reorder level is required'),
  supplier: yup.string().required('Supplier is required'),
});

// User validation schema
export const userSchema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  role: yup.string().oneOf(['Admin', 'Manager', 'Staff', 'Viewer']).required('Role is required'),
  department: yup.string().required('Department is required'),
  phone: yup.string().matches(/^[0-9+\-\s()]+$/, 'Invalid phone number'),
});

// Vendor validation schema
export const vendorSchema = yup.object({
  name: yup.string().required('Vendor name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string().required('Phone is required'),
  address: yup.string().required('Address is required'),
  contactPerson: yup.string().required('Contact person is required'),
  status: yup.string().oneOf(['Active', 'Inactive']).required('Status is required'),
  isPreferred: yup.boolean().default(false),
});

// BOM validation schema
export const bomSchema = yup.object({
  projectId: yup.string().required('Project is required'),
  itemName: yup.string().required('Item name is required'),
  materials: yup.array().of(
    yup.object({
      materialId: yup.string().required('Material is required'),
      quantity: yup.number().positive('Quantity must be positive').required('Quantity is required'),
      availableStock: yup.number().min(0, 'Available stock must be non-negative'),
    })
  ).min(1, 'At least one material is required'),
});

export const bomItemSchema = yup.object({
  materialId: yup.string().required('Material is required'),
  quantity: yup.number().positive('Quantity must be positive').required('Quantity is required'),
  availableStock: yup.number().min(0, 'Available stock must be non-negative'),
});

// Work Order validation schema
export const workOrderSchema = yup.object({
  projectId: yup.string().required('Project is required'),
  title: yup.string().required('Title is required'),
  description: yup.string().required('Description is required'),
  assignedTo: yup.string().required('Assignee is required'),
  priority: yup.string().oneOf(['Low', 'Medium', 'High', 'Critical']).required('Priority is required'),
  dueDate: yup.string().required('Due date is required'),
});

// Purchase Order validation schema
export const purchaseOrderSchema = yup.object({
  projectId: yup.string().required('Project is required'),
  bomId: yup.string().required('BOM is required'),
  vendorId: yup.string().required('Vendor is required'),
  items: yup.array().of(
    yup.object({
      itemId: yup.string().required('Item is required'),
      quantity: yup.number().positive('Quantity must be positive').required('Quantity is required'),
    })
  ).min(1, 'At least one item is required'),
  deliveryDate: yup.string().required('Delivery date is required'),
});

// Gate Pass validation schema
export const gatePassSchema = yup.object({
  type: yup.string().oneOf(['Inward', 'Outward']).required('Type is required'),
  vehicleNumber: yup.string().required('Vehicle number is required'),
  driverName: yup.string().required('Driver name is required'),
  purpose: yup.string().required('Purpose is required'),
  items: yup.array().of(
    yup.object({
      itemId: yup.string().required('Item is required'),
      quantity: yup.number().positive('Quantity must be positive').required('Quantity is required'),
    })
  ).min(1, 'At least one item is required'),
});