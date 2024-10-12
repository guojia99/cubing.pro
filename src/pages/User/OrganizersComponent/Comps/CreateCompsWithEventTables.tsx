import {
  Button,
  Form,
  GetRef,
  Input,
  InputNumber,
  InputRef,
  Popconfirm,
  Table,
  TableProps,
} from 'antd';
import React, { useContext, useEffect, useRef, useState } from 'react';

const EventTableForm: React.FC = () => {
  interface EventItem {
    key: string;
    eventId: string;
    round: number;
  }

  interface DataType {
    key: React.Key;
    eventId: string;
    round: number;
  }

  interface EditableRowProps {
    index: number;
  }

  type FormInstance<T> = GetRef<typeof Form<T>>;

  const EditableContext = React.createContext<FormInstance<any> | null>(null);

  const EditableRow: React.FC<EditableRowProps> = ({ index, ...props }) => {
    const [form] = Form.useForm();
    return (
      <Form form={form} component={false}>
        <EditableContext.Provider value={form}>
          <tr {...props} />
        </EditableContext.Provider>
      </Form>
    );
  };

  interface EditableCellProps {
    title: React.ReactNode;
    editable: boolean;
    dataIndex: keyof EventItem;
    record: EventItem;
    handleSave: (record: EventItem) => void;
  }

  const EditableCell: React.FC<React.PropsWithChildren<EditableCellProps>> = ({
    title,
    editable,
    children,
    dataIndex,
    record,
    handleSave,
    ...restProps
  }) => {
    const [editing, setEditing] = useState(false);
    const inputRef = useRef<InputRef>(null);
    const form = useContext(EditableContext)!;

    useEffect(() => {
      if (editing) {
        inputRef.current?.focus();
      }
    }, [editing]);

    const toggleEdit = () => {
      setEditing(!editing);
      form.setFieldsValue({ [dataIndex]: record[dataIndex] });
    };

    const save = async () => {
      try {
        const values = await form.validateFields();

        toggleEdit();
        handleSave({ ...record, ...values });
      } catch (errInfo) {
        console.log('保存失败:', errInfo);
      }
    };

    let childNode = children;

    if (editable) {
      childNode = editing ? (
        <Form.Item
          style={{ margin: 0 }}
          name={dataIndex}
          rules={[{ required: true, message: `${title} is required.` }]}
        >
          <Input ref={inputRef} onPressEnter={save} onBlur={save} />
        </Form.Item>
      ) : (
        <div
          className="editable-cell-value-wrap"
          style={{ paddingInlineEnd: 24 }}
          onClick={toggleEdit}
        >
          {children}
        </div>
      );
    }

    return <td {...restProps}>{childNode}</td>;
  };

  type ColumnTypes = Exclude<TableProps<DataType>['columns'], undefined>;

  const [dataSource, setDataSource] = useState<DataType[]>([
    {
      key: '0',
      eventId: '333',
      round: 1,
    },
  ]);

  const [count, setCount] = useState(2);

  const handleDelete = (key: React.Key) => {
    const newData = dataSource.filter((item) => item.key !== key);
    setDataSource(newData);
  };

  const handleInputChange = (value: any, key: React.Key, dataIndex: string | number) => {
    const newData = [...dataSource];
    const index = newData.findIndex((item) => key === item.key);
    if (index > -1) {
      // @ts-ignore
      newData[index][dataIndex] = value;
      setDataSource(newData);
    }
  };

  const defaultColumns: (ColumnTypes[number] & { editable?: boolean; dataIndex: string })[] = [
    {
      title: '项目',
      dataIndex: 'eventId',
      width: 100,
      editable: true,
    },
    {
      title: '轮次',
      dataIndex: 'round',
      editable: true,

      render: (_, record) => (
        <InputNumber
          min={1}
          defaultValue={record.round}
          onChange={(value) => handleInputChange(value, record.key, 'round')}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '操作',
      dataIndex: 'operation',
      render: (_, record) =>
        dataSource.length >= 1 ? (
          <Popconfirm title="是否删除?" onConfirm={() => handleDelete(record.key)}>
            <a>删除</a>
          </Popconfirm>
        ) : null,
      width: 30,
    },
  ];

  const handleAdd = () => {
    const newData: DataType = {
      key: count,
      eventId: '333',
      round: 1,
    };
    setDataSource([...dataSource, newData]);
    setCount(count + 1);
  };

  const handleAddAllWca = () => {
    const newData: DataType = {
      key: count,
      eventId: '333',
      round: 1,
    };
    setDataSource([...dataSource, newData]);
    setCount(count + 1);
  };

  const handleSave = (row: DataType) => {
    const newData = [...dataSource];
    const index = newData.findIndex((item) => row.key === item.key);
    const item = newData[index];
    newData.splice(index, 1, {
      ...item,
      ...row,
    });
    setDataSource(newData);
  };

  const components = {
    body: {
      row: EditableRow,
      cell: EditableCell,
    },
  };

  const columns = defaultColumns.map((col) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record: DataType) => ({
        record,
        editable: col.editable,
        dataIndex: col.dataIndex,
        title: col.title,
        handleSave,
      }),
    };
  });

  return (
    <div>
      <Table<DataType>
        components={components}
        rowClassName={() => 'editable-row'}
        bordered
        dataSource={dataSource}
        columns={columns as ColumnTypes}
        pagination={false}
        size={'small'}
      />

      <Button onClick={handleAdd} type="default" style={{ marginTop: 16, float: 'right' }}>
        添加项目
      </Button>
      <Button
        onClick={handleAddAllWca}
        type="default"
        style={{ marginTop: 16, marginRight: 5, float: 'right' }}
      >
        所有WCA项目
      </Button>
    </div>
  );
};

export default EventTableForm;
