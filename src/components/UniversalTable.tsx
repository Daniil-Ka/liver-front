import {useMemo, useState} from 'react';
import {MRT_Localization_RU} from 'material-react-table/locales/ru';
import {
  MaterialReactTable,
  type MRT_ColumnDef,
  type MRT_ColumnFiltersState,
  type MRT_PaginationState,
  type MRT_SortingState,
  useMaterialReactTable,
} from 'material-react-table';
import {IconButton, Tooltip} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import {keepPreviousData, useQuery,} from '@tanstack/react-query';
import { createTheme, ThemeProvider, Button } from '@mui/material';
import { styled } from '@mui/material';
import Box from "@mui/material/Box";

const CustomButton = styled(Button)(({ theme }) => ({
  border: 'none', // Removes the border
  outline: 'none', // Removes the outline
  '&:hover': {
    backgroundColor: theme.palette.primary.light, // Change hover background color
  },
  '&:focus': {
    outline: 'none', // Removes the focus outline
  },
}));

//Your API response shape will probably be different. Knowing a total row count is important though.
type UserApiResponse = {
  data: Array<User>;
  meta: {
    totalRowCount: number;
  };
};

type User = {
  firstName: string;
  lastName: string;
  address: string;
  state: string;
  phoneNumber: string;
  lastLogin: Date;
};

const customLocalization = {
  ...MRT_Localization_RU, // копируем все фразы
  filterFuzzy: 'Нечеткий поиск',
};

const UniversalTable = () => {
  //manage our own state for stuff we want to pass to the API
  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>(
    [],
  );
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<MRT_SortingState>([]);
  const [pagination, setPagination] = useState<MRT_PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  //consider storing this code in a custom hook (i.e useFetchUsers)
  const {
    data: { data = [], meta } = {}, //your data and api response will probably be different
    isError,
    isRefetching,
    isLoading,
    refetch,
  } = useQuery<UserApiResponse>({
    queryKey: [
      'table-data',
      columnFilters, //refetch when columnFilters changes
      globalFilter, //refetch when globalFilter changes
      pagination.pageIndex, //refetch when pagination.pageIndex changes
      pagination.pageSize, //refetch when pagination.pageSize changes
      sorting, //refetch when sorting changes
    ],
    queryFn: async () => {
      const fetchURL = new URL('/api/data', location.origin);

      fetchURL.searchParams.set(
        'start',
        `${pagination.pageIndex * pagination.pageSize}`,
      );
      fetchURL.searchParams.set('size', `${pagination.pageSize}`);

      fetchURL.searchParams.set(
        'filters',
        JSON.stringify(
          columnFilters.map((filter) => {
            const column = table.getColumn(filter.id); // получаем столбец
            const filterFn = column?.columnDef.filterFn; // получаем функцию фильтра, если она есть
            const filterType = typeof filterFn === 'function' && 'name' in filterFn ? filterFn.name : null; // проверяем наличие 'name'

            return {
              id: filter.id,  // идентификатор столбца
              value: filter.value,  // значение фильтра
              filterType,  // тип фильтра или null, если 'name' отсутствует
            };
          })
        )
      );

      fetchURL.searchParams.set('globalFilter', globalFilter ?? '');
      fetchURL.searchParams.set('sorting', JSON.stringify(sorting ?? []));

      //use whatever fetch library you want, fetch, axios, etc
      const response = await fetch(fetchURL.href);
      return (await response.json()) as UserApiResponse;
    },
    placeholderData: keepPreviousData, //don't go to 0 rows when refetching or paginating to next page
  });

  const columns = useMemo<MRT_ColumnDef<User>[]>(
    () => [
      {
        accessorKey: 'firstName',
        header: 'First Name',
      },
      {
        accessorKey: 'lastName',
        header: 'Last Name',
      },
      {
        accessorKey: 'address',
        header: 'Address',
      },
      {
        accessorKey: 'state',
        header: 'State',
      },
      {
        accessorKey: 'phoneNumber',
        header: 'Phone Number',
      },
      {
        accessorFn: (row) => new Date(row.lastLogin),
        id: 'lastLogin',
        header: 'Last Login',
        Cell: ({ cell }) => new Date(cell.getValue<Date>()).toLocaleString(),
        filterFn: 'greaterThan',
        filterVariant: 'date',
        enableGlobalFilter: false,
      },
    ],
    [],
  );

  const table = useMaterialReactTable({
    columns,
    data,
    initialState: { showColumnFilters: true },
    manualFiltering: true, //turn off built-in client-side filtering
    enableColumnFilterModes: true,
    manualPagination: true, //turn off built-in client-side pagination
    manualSorting: true, //turn off built-in client-side sorting
    muiToolbarAlertBannerProps: isError
      ? {
          color: 'error',
          children: 'Error loading data',
        }
      : undefined,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,

    renderTopToolbarCustomActions: () => (
      <Tooltip arrow title="Refresh Data">
        <IconButton onClick={() => refetch()}>
          <RefreshIcon />
        </IconButton>
      </Tooltip>
    ),

    rowCount: meta?.totalRowCount ?? 0,
    state: {
      columnFilters,
      globalFilter,
      isLoading,
      pagination,
      showAlertBanner: isError,
      showProgressBars: isRefetching,
      sorting,
    },

    localization: customLocalization,
  });

  return (
      <ThemeProvider theme={createTheme()}>
        <Box sx={{width: '100%'}}>
          <MaterialReactTable
              table={table}
          />
        </Box>
      </ThemeProvider>
);
};

export default UniversalTable;
