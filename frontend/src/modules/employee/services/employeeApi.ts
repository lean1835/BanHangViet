import { baseApi } from "../../../stores/baseApi";
import { IEmployee } from "../types/employee";

export const employeeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllEmployees: builder.query<IEmployee[], void>({
      query: () => ({
        url: "/employees",
        method: "GET",
      }),
      transformResponse: (response: any): IEmployee[] => {
        const list = response.result || [];
        return list.map((emp: any) => ({
          id: emp.id,
          username: emp.username,
          fullName: emp.fullName,
          phoneNumber: emp.phoneNumber || "",
          roleCode: emp.roleCode,
          isActive: emp.isActive !== false,
        }));
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "User" as const, id })),
              { type: "User", id: "LIST" },
            ]
          : [{ type: "User", id: "LIST" }],
    }),
    createEmployee: builder.mutation<IEmployee, Partial<IEmployee> & { password?: string }>({
      query: (employeeData) => ({
        url: "/employees",
        method: "POST",
        body: {
          username: employeeData.username,
          password: employeeData.password,
          fullName: employeeData.fullName,
          phoneNumber: employeeData.phoneNumber,
          roleCode: employeeData.roleCode,
        },
      }),
      transformResponse: (response: any): IEmployee => {
        const emp = response.result;
        return {
          id: emp.id,
          username: emp.username,
          fullName: emp.fullName,
          phoneNumber: emp.phoneNumber || "",
          roleCode: emp.roleCode,
          isActive: emp.isActive !== false,
        };
      },
      invalidatesTags: [{ type: "User", id: "LIST" }],
    }),
    updateEmployee: builder.mutation<IEmployee, { id: string; data: Partial<IEmployee> }>({
      query: ({ id, data }) => ({
        url: `/employees/${id}`,
        method: "PUT",
        body: {
          fullName: data.fullName,
          phoneNumber: data.phoneNumber,
          roleCode: data.roleCode,
          isActive: data.isActive,
        },
      }),
      transformResponse: (response: any): IEmployee => {
        const emp = response.result;
        return {
          id: emp.id,
          username: emp.username,
          fullName: emp.fullName,
          phoneNumber: emp.phoneNumber || "",
          roleCode: emp.roleCode,
          isActive: emp.isActive !== false,
        };
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: "User", id: "LIST" },
        { type: "User", id },
      ],
    }),
    deleteEmployee: builder.mutation<void, string>({
      query: (id) => ({
        url: `/employees/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "User", id: "LIST" },
        { type: "User", id },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAllEmployeesQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
} = employeeApi;
